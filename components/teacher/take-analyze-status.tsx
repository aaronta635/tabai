import { analyzeStatusLine, isOpenAnalyze, type AnalyzeJobView, type AnalyzeStatusCopy } from "@/lib/analyze-status";

export function TakeAnalyzeStatus({
  job,
  copy,
}: {
  job: AnalyzeJobView | null;
  copy: AnalyzeStatusCopy;
}) {
  const line = analyzeStatusLine(job, copy);
  const open = isOpenAnalyze(job?.status);
  return (
    <div className="analyze-status" role="status">
      <p className="text-sm">{line}</p>
      {open ? (
        <div className="analyze-bar" role="progressbar" aria-valuetext={line}>
          <span />
        </div>
      ) : null}
      {job?.lastError ? <pre className="analyze-log">{job.lastError}</pre> : null}
    </div>
  );
}
