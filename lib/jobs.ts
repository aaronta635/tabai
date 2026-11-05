import type { JobStatus, JobType, Prisma } from "@prisma/client";
import { wakeCloudWorker } from "@/lib/cloud-worker";
import { PIPELINE_VERSION_SCORE } from "@/lib/constants";
import { analyzeAllowed } from "@/lib/demo-piece";
import { CLAIMABLE_SUBMISSION_STATUSES } from "@/lib/forms";
import { prisma } from "@/lib/prisma";
import { needsPitchOverlay } from "@/lib/pitch-overlay";
import {
  draftCoversFactVerdicts,
  heardExtractFromMetrics,
  latestFactVerdictAt,
  observationMarkers,
  whyDraftNotReady,
} from "@/lib/score-model";

export async function enqueueJob(
  type: JobType,
  payload: Prisma.InputJsonValue,
  submissionId?: string,
) {
  const job = await prisma.job.create({
    data: {
      type,
      payload,
      submissionId,
    },
  });
  wakeCloudWorker();
  return job;
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
    include: { student: true, piece: { select: { demo: true } } },
  });
  if (!submission) return null;
  if (!analyzeAllowed(submission.piece.demo, submission.student.approvedAt)) return null;
  const open = await prisma.job.findFirst({
    where: { type: "analyze", submissionId, status: { in: ["pending", "running"] } },
  });
  if (open) return open;
  return enqueueJob("analyze", { submissionId }, submissionId);
}

/** After a PieceModel is ready, re-run takes that never got score-compare, take extract, or this pitch overlay version. A demo take is included before the student is approved. */
export async function enqueueTakesNeedingCompare(pieceId: string) {
  const takes = await prisma.submission.findMany({
    where: {
      pieceId,
      kind: { in: ["take", "overdub"] },
      status: { in: [...CLAIMABLE_SUBMISSION_STATUSES] },
      OR: [{ student: { approvedAt: { not: null } } }, { piece: { demo: true } }],
    },
    select: {
      id: true,
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { pipelineVersion: true, observationsJson: true, metricsJson: true },
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
    const heard = heardExtractFromMetrics(latest?.metricsJson) != null;
    if (compared && heard && !needsPitchOverlay(latest?.metricsJson)) continue;
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

/** Draft only after every timed fact has Đúng/Sai, or when there are no bars to mark. */
export async function enqueueDraftWhenReady(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      status: true,
      kind: true,
      piece: { select: { demo: true } },
      student: { select: { approvedAt: true } },
      analyses: { orderBy: { createdAt: "desc" }, take: 1, select: { observationsJson: true } },
      drafts: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });
  if (!submission) {
    console.log("draft enqueue", submissionId, "skip no_submission");
    return null;
  }
  const skip = whyDraftNotReady({
    kind: submission.kind,
    status: submission.status,
    approved: analyzeAllowed(submission.piece.demo, submission.student.approvedAt),
    observations: submission.analyses[0]?.observationsJson,
  });
  if (skip) {
    console.log("draft enqueue", submissionId, "skip", skip);
    return null;
  }
  const open = await prisma.job.findFirst({
    where: { type: "draft", submissionId, status: { in: ["pending", "running"] } },
    select: { id: true },
  });
  if (open) {
    console.log("draft enqueue", submissionId, "already_open", open.id);
    return open;
  }
  const markers = observationMarkers(submission.analyses[0]?.observationsJson);
  const draftAt = submission.drafts?.[0]?.createdAt ?? null;
  const covered =
    Boolean(draftAt) &&
    (markers.length === 0 ||
      draftCoversFactVerdicts(draftAt!.toISOString(), latestFactVerdictAt(markers), markers.length));
  if (covered) {
    console.log("draft enqueue", submissionId, "skip covered");
    return null;
  }
  const job = await enqueueJob("draft", { submissionId }, submissionId);
  console.log("draft enqueue", submissionId, job.id);
  return job;
}

/** Train on a long tutorial can run well past a few minutes; shorter windows re-run live jobs. */
const STALE_RUNNING_MS = 20 * 60 * 1000;
export const MAX_JOB_ATTEMPTS = 3;
export const MAX_TRAIN_FAILURES = 3;

/** Requeue jobs whose worker died mid-run; after MAX_JOB_ATTEMPTS they stay failed. */
export async function reclaimStaleJobs() {
  const staleBefore = new Date(Date.now() - STALE_RUNNING_MS);
  const stuck = { status: "running" as const, updatedAt: { lt: staleBefore } };
  const exhausted = await prisma.job.updateMany({
    where: { ...stuck, attempts: { gte: MAX_JOB_ATTEMPTS } },
    data: { status: "failed", lastError: `stopped mid-run ${MAX_JOB_ATTEMPTS} times` },
  });
  if (exhausted.count) console.log("gave up on stuck jobs", exhausted.count);
  const stale = await prisma.job.updateMany({
    where: { ...stuck, attempts: { lt: MAX_JOB_ATTEMPTS } },
    data: { status: "pending" },
  });
  return stale.count;
}

export function trainKeepsFailing(recentStatuses: JobStatus[]) {
  return (
    recentStatuses.length >= MAX_TRAIN_FAILURES &&
    recentStatuses.slice(0, MAX_TRAIN_FAILURES).every((status) => status === "failed")
  );
}

/** True when this piece's last MAX_TRAIN_FAILURES train jobs all failed. A new teacher upload still trains. */
export async function pieceTrainKeepsFailing(pieceId: string) {
  const recent = await prisma.job.findMany({
    where: { type: "train_piece", payload: { path: ["pieceId"], equals: pieceId } },
    orderBy: { createdAt: "desc" },
    take: MAX_TRAIN_FAILURES,
    select: { status: true },
  });
  return trainKeepsFailing(recent.map((job) => job.status));
}

export async function claimNextJob() {
  const reclaimed = await reclaimStaleJobs();
  if (reclaimed) console.log("reclaimed stale jobs", reclaimed);
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
