import type { Job } from "@prisma/client";
import { PROMOTE_GEMINI_FOLLOW_UP } from "@/lib/jobs-promote-followup";
import { prisma } from "@/lib/prisma";

export type AnalyzeJobPayload = {
  submissionId?: string;
  startedAsPractice?: boolean;
  [PROMOTE_GEMINI_FOLLOW_UP]?: boolean;
};

/** Remember whether this analyze job began while the clip was still practice (for one follow-up after promote). */
export async function stampAnalyzeJobStartedAsPractice(job: Job): Promise<Job> {
  if (job.type !== "analyze") return job;
  const payload = (job.payload ?? {}) as AnalyzeJobPayload;
  if (payload.startedAsPractice !== undefined) return job;
  const submissionId = payload.submissionId ?? job.submissionId ?? undefined;
  if (!submissionId) return job;
  const row = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { kind: true },
  });
  const startedAsPractice = row?.kind === "practice";
  return {
    ...job,
    payload: { ...payload, submissionId, startedAsPractice },
  };
}