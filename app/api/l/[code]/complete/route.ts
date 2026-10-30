import { NextRequest, NextResponse } from "next/server";
import { studentForPiece } from "@/lib/auth";
import { shouldAttachTeacher } from "@/lib/demo-piece";
import { logEvent } from "@/lib/events";
import { enqueueAnalyzeIfApproved } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { submissionNote } from "@/lib/forms";
import { parseSubmissionKind } from "@/lib/practice";
import { revalidateStudentHotPath } from "@/lib/student-cache";
import { isOwnTakeMedia } from "@/lib/take-media";

export async function POST(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const piece = await prisma.piece.findUnique({ where: { code } });
  if (!piece || piece.archived) {
    return NextResponse.json({ error: "piece not found" }, { status: 404 });
  }

  const bound = await studentForPiece(piece.teacherId, { demo: piece.demo });
  if (bound.otherClass) {
    return NextResponse.json({ error: "other class" }, { status: 409 });
  }
  let student = bound.student;
  if (!student) {
    return NextResponse.json({ error: "register first" }, { status: 401 });
  }
  if (shouldAttachTeacher(piece.demo, student.teacherId)) {
    student = await prisma.student.update({
      where: { id: student.id },
      data: { teacherId: piece.teacherId, stage: "in_class" },
    });
  }

  const body = (await request.json()) as { mediaId?: string; kind?: string; note?: unknown };
  if (!body.mediaId) {
    return NextResponse.json({ error: "mediaId required" }, { status: 400 });
  }
  const note = submissionNote(body.note);
  if (note === undefined) {
    return NextResponse.json({ error: "note too long" }, { status: 400 });
  }

  const media = await prisma.media.findUnique({ where: { id: body.mediaId } });
  if (!media || media.storagePath === "pending") {
    return NextResponse.json({ error: "media not ready" }, { status: 400 });
  }
  if (!isOwnTakeMedia(media.storagePath, { teacherId: piece.teacherId, pieceId: piece.id, studentId: student.id })) {
    return NextResponse.json({ error: "media mismatch" }, { status: 403 });
  }
  const attached = await prisma.submission.findFirst({ where: { mediaId: media.id }, select: { id: true } });
  if (attached) {
    return NextResponse.json({ error: "media already submitted" }, { status: 409 });
  }

  const kind = parseSubmissionKind(body.kind);
  const submission = await prisma.submission.create({
    data: {
      pieceId: piece.id,
      studentId: student.id,
      mediaId: media.id,
      kind,
      studentNote: note,
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
  revalidateStudentHotPath(student.id);

  return NextResponse.json({
    submissionId: submission.id,
    ...(bound.fromSession ? { page: `/student/takes/${submission.id}` } : {}),
  });
}
