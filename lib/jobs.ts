import type { JobType, Prisma } from "@prisma/client";
import { PIPELINE_VERSION_SCORE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function enqueueJob(
  type: JobType,
  payload: Prisma.InputJsonValue,
  submissionId?: string,
) {
  return prisma.job.create({
    data: {
      type,
      payload,
      submissionId,
    },
  });
}

export async function enqueueTrainPiece(pieceId: string) {
  const piece = await prisma.piece.findUnique({
    where: { id: pieceId },
    select: { sheetMediaId: true, tutorialMediaId: true },
  });
  if (!piece) throw new Error("piece not found");
  if (!piece.sheetMediaId && !piece.tutorialMediaId) {
    throw new Error("piece needs a sheet or a tutorial before train");
  }
  return enqueueJob("train_piece", { pieceId });
}

export async function enqueueAnalyzeIfApproved(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { student: true },
  });
  if (!submission) return null;
  if (!submission.student.approvedAt) return null;
  return enqueueJob("analyze", { submissionId }, submissionId);
}

/** After a PieceModel is ready, re-run takes that never got score-compare observations. */
export async function enqueueTakesNeedingCompare(pieceId: string) {
  const takes = await prisma.submission.findMany({
    where: {
      pieceId,
      kind: { in: ["take", "overdub"] },
      student: { approvedAt: { not: null } },
    },
    select: {
      id: true,
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { pipelineVersion: true, observationsJson: true },
      },
    },
  });
  const open = await prisma.job.findMany({
    where: {
      type: "analyze",
      status: { in: ["pending", "running"] },
      submissionId: { in: takes.map((take) => take.id) },
    },
    select: { submissionId: true },
  });
  const openIds = new Set(open.map((job) => job.submissionId).filter((id): id is string => Boolean(id)));
  const jobs = [];
  for (const take of takes) {
    if (openIds.has(take.id)) continue;
    const latest = take.analyses[0];
    const compared =
      latest?.pipelineVersion === PIPELINE_VERSION_SCORE && latest.observationsJson != null;
    if (compared) continue;
    const job = await enqueueAnalyzeIfApproved(take.id);
    if (job) jobs.push(job);
  }
  return jobs;
}

/** Re-analyze takes that never got a score compare after a piece model became ready. */
export async function enqueueAllTakesNeedingCompare() {
  const pieces = await prisma.piece.findMany({
    where: {
      archived: false,
      models: { some: { status: "ready" } },
    },
    select: { id: true, code: true },
  });
  const queued = [];
  for (const piece of pieces) {
    const jobs = await enqueueTakesNeedingCompare(piece.id);
    if (jobs.length) queued.push({ code: piece.code, count: jobs.length });
  }
  return queued;
}

export async function claimNextJob() {
  const pending = await prisma.job.findFirst({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
  });
  if (!pending) return null;

  const claimed = await prisma.job.updateMany({
    where: { id: pending.id, status: "pending" },
    data: { status: "running", attempts: { increment: 1 } },
  });
  if (claimed.count === 0) return null;

  return prisma.job.findUnique({ where: { id: pending.id } });
}

export async function finishJob(id: string) {
  return prisma.job.update({ where: { id }, data: { status: "done", lastError: null } });
}

export async function failJob(id: string, error: string) {
  return prisma.job.update({
    where: { id },
    data: { status: "failed", lastError: error.slice(0, 2000) },
  });
}
