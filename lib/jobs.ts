import type { JobType, Prisma } from "@prisma/client";
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

export async function enqueueAnalyzeIfApproved(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { student: true },
  });
  if (!submission) return null;
  if (!submission.student.approvedAt) return null;
  return enqueueJob("analyze", { submissionId }, submissionId);
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
