import { prisma } from "@/lib/prisma";

/**
 * Growth hooks — v1 does not unlock these. Call sites should keep using
 * teacherId-scoped queries. New layers add migrations + job types, not a new app.
 *
 * v2 modules/cohorts: add Module, Cohort tables; Piece.moduleId; Student.cohortId
 * v2 wall: query Submission where teacherPick and Student.publicOk and ageBand=adult
 * v2 AI-direct: Piece.aiDirectUnlockedAt + Submission.route/confidence
 * v3 perception: JobType perceive_audio | perceive_video
 * Score-model V1: JobType train_piece; PieceModel; Analysis.observationsJson from Gemini compare
 * v3 school: Org model; storage region on Org
 * Live Zoom-class / MIDI / 150 games / recital: deferred until the between-lesson loop is habitual.
 */

export function shouldUnlockAiDirect(input: {
  repliesOnPiece: number;
  approveUntouchedLast50: number;
}) {
  return input.repliesOnPiece >= 100 && input.approveUntouchedLast50 >= 0.8;
}

export function routeSubmission(input: {
  aiDirectUnlockedAt: Date | null;
  confidence: number | null;
}) {
  if (!input.aiDirectUnlockedAt) return "teacher" as const;
  if (input.confidence == null || input.confidence < 0.8) return "teacher" as const;
  return "ai_direct" as const;
}

export function wallVisible(input: { publicOk: boolean; ageBand: "under18" | "adult"; teacherPick: boolean }) {
  if (input.ageBand === "under18") return false;
  return input.publicOk && input.teacherPick;
}

export async function maybeUnlockAiDirect(pieceId: string) {
  const piece = await prisma.piece.findUnique({
    where: { id: pieceId },
    select: { aiDirectUnlockedAt: true },
  });
  if (!piece || piece.aiDirectUnlockedAt) return piece?.aiDirectUnlockedAt ?? null;

  const repliesOnPiece = await prisma.reply.count({
    where: { submission: { pieceId, kind: { in: ["take", "overdub"] } } },
  });
  const last50 = await prisma.reply.findMany({
    where: { submission: { pieceId, kind: { in: ["take", "overdub"] } } },
    orderBy: { sentAt: "desc" },
    take: 50,
    select: { source: true },
  });
  const untouched = last50.length
    ? last50.filter((row) => row.source === "approved_draft").length / last50.length
    : 0;
  if (!shouldUnlockAiDirect({ repliesOnPiece, approveUntouchedLast50: untouched })) {
    return null;
  }
  const updated = await prisma.piece.update({
    where: { id: pieceId },
    data: { aiDirectUnlockedAt: new Date() },
  });
  return updated.aiDirectUnlockedAt;
}

export async function sendApprovedDraft(input: {
  submissionId: string;
  teacherId: string;
  text: string;
}) {
  const sentAt = new Date();
  const claimed = await prisma.$transaction(async (tx) => {
    const updated = await tx.submission.updateMany({
      where: { id: input.submissionId, status: { in: ["new", "drafted"] } },
      data: { status: "answered", route: "ai_direct" },
    });
    if (updated.count === 0) return false;
    await tx.reply.create({
      data: {
        submissionId: input.submissionId,
        teacherId: input.teacherId,
        text: input.text,
        source: "approved_draft",
        editDistance: 0,
        openedAt: sentAt,
        sentAt,
      },
    });
    return true;
  });
  if (!claimed) return false;
  await prisma.event.create({
    data: {
      actorType: "system",
      actorId: input.teacherId,
      teacherId: input.teacherId,
      name: "reply.sent",
      propsJson: {
        submissionId: input.submissionId,
        source: "approved_draft",
        route: "ai_direct",
        timePerReplyMs: 0,
      },
    },
  });
  return true;
}

export async function maybeRelockAiDirect(pieceId: string) {
  const piece = await prisma.piece.findUnique({
    where: { id: pieceId },
    select: { aiDirectUnlockedAt: true },
  });
  if (!piece?.aiDirectUnlockedAt) return false;
  const recent = await prisma.reply.findMany({
    where: {
      submission: { pieceId, route: "ai_direct" },
    },
    orderBy: { sentAt: "desc" },
    take: 20,
    select: { source: true },
  });
  if (recent.length < 10) return false;
  const overrides = recent.filter((row) => row.source !== "approved_draft").length / recent.length;
  if (overrides < 0.3) return false;
  await prisma.piece.update({
    where: { id: pieceId },
    data: { aiDirectUnlockedAt: null },
  });
  return true;
}
