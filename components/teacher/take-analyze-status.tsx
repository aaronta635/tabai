"use client";

import { analyzeStatusLine, isOpenAnalyze, type AnalyzeJobView, type AnalyzeStatusCopy } from "@/lib/analyze-status";
import { ANALYZE_WAIT_MS } from "@/lib/constants";
import { serviceWaitTimedOut } from "@/lib/service-wait";
import { useServiceWaitClock } from "@/lib/use-service-wait-clock";

export function TakeAnalyzeStatus({
  job,
  copy,
}: {
  job: AnalyzeJobView | null;
  copy: AnalyzeStatusCopy;
}) {
  const openJob = isOpenAnalyze(job?.status);
  const now = useServiceWaitClock(openJob, job?.updatedAt, ANALYZE_WAIT_MS);
  const timedOut = Boolean(openJob && job?.updatedAt && serviceWaitTimedOut(job.updatedAt, ANALYZE_WAIT_MS, now));
  const waiting = openJob && !timedOut;
  const line = timedOut ? (copy.timedOut ?? copy.failed) : analyzeStatusLine(job, copy);
  return (
    <div className="analyze-status" role="status">
      <p className="text-sm">{line}</p>
      {waiting ? (
        <div className="analyze-bar" role="progressbar" aria-valuetext={line}>
          <span />
        </div>
      ) : null}
      {job?.lastError ? <pre className="analyze-log">{job.lastError}</pre> : null}
    </div>
  );
}
