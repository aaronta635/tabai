import type { Prisma } from "@prisma/client";
import { getReadyPieceModel } from "@/lib/catalog";
import { wakeCloudWorker } from "@/lib/cloud-worker";
import { analyzeAllowed } from "@/lib/demo-piece";
import {
  geminiVisualErrorCodeFromMetrics,
  savedAnalysisLacksGeminiVisual,
} from "@/lib/gemini-visual";
import { prisma } from "@/lib/prisma";
import { usesGeminiVisual } from "@/lib/practice";

export const PROMOTE_GEMINI_FOLLOW_UP = "promoteGeminiFollowUp" as const;

export type GeminiFollowUpContext = {
  /** Set on the finishing worker job when analyze began while kind was practice. */
  finishingStartedAsPractice?: boolean;
  /** Do not chain follow-up jobs off a follow-up analyze job. */
  finishingWasPromoteFollowUp?: boolean;
  /** Student just promoted practice→take from the app. */
  fromPromotion?: boolean;
};

async function findOpenAnalyze(submissionId: string) {
  return prisma.job.findFirst({
    where: { type: "analyze", submissionId, status: { in: ["pending", "running"] } },
    select: { id: true, status: true, payload: true },
  });
}

export function promoteGeminiFollowUpEligible(ctx: GeminiFollowUpContext) {
  if (ctx.finishingWasPromoteFollowUp) return false;
  return Boolean(ctx.fromPromotion || ctx.finishingStartedAsPractice);
}

/**
 * Queue at most one post-promotion Gemini analyze. Idempotent for promote clicks and late worker windows.
 */
export async function enqueueGeminiFollowUpIfPromoted(submissionId: string, ctx: GeminiFollowUpContext = {}) {
  if (!promoteGeminiFollowUpEligible(ctx)) return null;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      student: true,
      piece: { select: { demo: true, id: true } },
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { metricsJson: true, observationsJson: true },
      },
    },
  });
  if (!submission) return null;
  if (!usesGeminiVisual(submission.kind)) return null;
  if (!analyzeAllowed(submission.piece.demo, submission.student.approvedAt)) return null;

  const latest = submission.analyses[0];
  if (!latest) return null;
  if (geminiVisualErrorCodeFromMetrics(latest.metricsJson)) return null;

  const pieceModel = await getReadyPieceModel(submission.piece.id);
  const pieceHasModel = Boolean(pieceModel);
  if (
    !savedAnalysisLacksGeminiVisual(
      submission.kind,
      latest.metricsJson,
      latest.observationsJson,
      pieceHasModel,
    )
  ) {
    return null;
  }

  const open = await findOpenAnalyze(submissionId);
  if (open) return open;

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT id FROM "Submission" WHERE id = ${submissionId} FOR UPDATE`;

    const priorFollowUp = await tx.job.findFirst({
      where: {
        submissionId,
        type: "analyze",
        payload: { path: [PROMOTE_GEMINI_FOLLOW_UP], equals: true },
      },
      select: { id: true, status: true, payload: true },
    });
    if (priorFollowUp) return priorFollowUp;

    const openLocked = await tx.job.findFirst({
      where: { type: "analyze", submissionId, status: { in: ["pending", "running"] } },
      select: { id: true, status: true, payload: true },
    });
    if (openLocked) return openLocked;

    const payload = {
      submissionId,
      [PROMOTE_GEMINI_FOLLOW_UP]: true,
    } satisfies Prisma.InputJsonObject;
    const created = await tx.job.create({
      data: {
        type: "analyze",
        submissionId,
        payload,
      },
    });
    wakeCloudWorker();
    return created;
  });
}