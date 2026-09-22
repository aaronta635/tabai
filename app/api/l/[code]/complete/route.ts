import { NextRequest, NextResponse } from "next/server";
import { studentForPiece } from "@/lib/auth";
import { logEvent } from "@/lib/events";
import { enqueueAnalyzeIfApproved } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { parseSubmissionKind } from "@/lib/practice";

export async function POST(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const piece = await prisma.piece.findUnique({ where: { code } });
  if (!piece || piece.archived) {
    return NextResponse.json({ error: "piece not found" }, { status: 404 });
  }

  const bound = await studentForPiece(piece.teacherId);
  if (bound.otherClass) {
    return NextResponse.json({ error: "other class" }, { status: 409 });
  }
  let student = bound.student;
  if (!student) {
    return NextResponse.json({ error: "register first" }, { status: 401 });
  }
  if (!student.teacherId) {
    student = await prisma.student.update({
      where: { id: student.id },
      data: { teacherId: piece.teacherId, stage: "in_class" },
    });
  }

  const body = (await request.json()) as { mediaId?: string; kind?: string };
  if (!body.mediaId) {
    return NextResponse.json({ error: "mediaId required" }, { status: 400 });
  }

  const media = await prisma.media.findUnique({ where: { id: body.mediaId } });
  if (!media || media.storagePath === "pending") {
    return NextResponse.json({ error: "media not ready" }, { status: 400 });
  }

  const kind = parseSubmissionKind(body.kind);
  const submission = await prisma.submission.create({
    data: {
      pieceId: piece.id,
      studentId: student.id,
      mediaId: media.id,
      kind,
    },
  });

  await logEvent({
    name: "submission.created",
    actorType: "student",
    actorId: student.id,
    teacherId: piece.teacherId,
    props: { submissionId: submission.id, approved: Boolean(student.approvedAt), kind },
  });

  await enqueueAnalyzeIfApproved(submission.id);

  return NextResponse.json({
    submissionId: submission.id,
    studentToken: student.token,
    page: bound.fromSession ? "/student/takes" : `/s/${student.token}`,
  });
}
