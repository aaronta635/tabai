export const ANALYZE_STATUSES = ["pending", "running", "done", "failed"] as const;
export type AnalyzeStatus = (typeof ANALYZE_STATUSES)[number];

export type AnalyzeJobView = {
  status: AnalyzeStatus;
  attempts: number;
  lastError: string | null;
  updatedAt: string;
};

export type AnalyzeStatusCopy = {
  pending: string;
  running: string;
  failed: string;
  none: string;
  doneEmpty: string;
};

export function isAnalyzeStatus(status: string): status is AnalyzeStatus {
  return (ANALYZE_STATUSES as readonly string[]).includes(status);
}

export function toAnalyzeJobView(job: {
  status: string;
  attempts: number;
  lastError: string | null;
  updatedAt: Date;
} | null): AnalyzeJobView | null {
  if (!job || !isAnalyzeStatus(job.status)) return null;
  return {
    status: job.status,
    attempts: job.attempts,
    lastError: job.lastError,
    updatedAt: job.updatedAt.toISOString(),
  };
}

export function isOpenAnalyze(status: AnalyzeStatus | null | undefined) {
  return status === "pending" || status === "running";
}

export function analyzeStatusLine(job: AnalyzeJobView | null, copy: AnalyzeStatusCopy) {
  if (!job) return copy.none;
  const withAttempt = (text: string) => text.replaceAll("{n}", String(job.attempts));
  switch (job.status) {
    case "pending":
      return withAttempt(copy.pending);
    case "running":
      return withAttempt(copy.running);
    case "failed":
      return copy.failed;
    case "done":
      return copy.doneEmpty;
    default: {
      const never: never = job.status;
      return never;
    }
  }
}
