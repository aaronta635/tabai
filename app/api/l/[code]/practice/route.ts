import { NextRequest, NextResponse } from "next/server";
import { studentForPiece } from "@/lib/auth";
import { logEvent } from "@/lib/events";
import { prisma } from "@/lib/prisma";

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
  const student = bound.student;
  if (!student) {
    return NextResponse.json({ error: "register first" }, { status: 401 });
  }

  const body = (await request.json()) as { seconds?: number; startedAt?: string };
  const seconds = Math.round(Number(body.seconds));
  if (!Number.isFinite(seconds) || seconds < 15 || seconds > 4 * 60 * 60) {
    return NextResponse.json({ error: "seconds required" }, { status: 400 });
  }

  const startedAt = body.startedAt ? new Date(body.startedAt) : new Date(Date.now() - seconds * 1000);
  const session = await prisma.practiceSession.create({
    data: {
      studentId: student.id,
      pieceId: piece.id,
      seconds,
      startedAt: Number.isNaN(startedAt.getTime()) ? new Date() : startedAt,
    },
  });

  if (!student.teacherId) {
    await prisma.student.update({
      where: { id: student.id },
      data: { teacherId: piece.teacherId, stage: "in_class" },
    });
  }

  await logEvent({
    name: "practice.session",
    actorType: "student",
    actorId: student.id,
    teacherId: piece.teacherId,
    props: { pieceId: piece.id, sessionId: session.id, seconds },
  });

  return NextResponse.json({ id: session.id, seconds: session.seconds });
}
