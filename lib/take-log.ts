import { isOpenAnalyze, type AnalyzeJobView } from "@/lib/analyze-status";
import { ANALYZE_WAIT_MS } from "@/lib/constants";
import { pitchErrorFromMetrics, pitchNotesFromMetrics } from "@/lib/pitch-overlay";
import { chordsFromScore, type TrainExtract } from "@/lib/score-model";
import { geminiVisualErrorCodeFromMetrics, pitchOverlaySkippedInMetrics } from "@/lib/gemini-visual";
import { serviceWaitTimedOut } from "@/lib/service-wait";

/** A take is treated as silent when at least this share of it is below the noise floor. */
export const SILENT_RATIO = 0.9;

/** What the take panel should tell the teacher. Each kind has its own wording. */
export const TAKE_LOG_KINDS = [
  "no_job",
  "queued",
  "running",
  "failed",
  "done_empty",
  "silent",
  "pitch_error",
  "no_notes",
  "ready",
] as const;
export type TakeLogKind = (typeof TAKE_LOG_KINDS)[number];

export type TakeLogCopy = {
  pending: string;
  running: string;
  failed: string;
  none: string;
  doneEmpty: string;
  silent: string;
  noNotes: string;
  pitchError: string;
  visualFailed: string;
  pitchOverlaySkipped: string;
  timedOut?: string;
};

function metricsRow(metrics: unknown): Record<string, unknown> | null {
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) return null;
  return metrics as Record<string, unknown>;
}

export function takeSilenceRatio(metrics: unknown): number | null {
  const ratio = metricsRow(metrics)?.silence_ratio;
  return typeof ratio === "number" && Number.isFinite(ratio) ? ratio : null;
}

export function metricsShowGeminiVisualFailure(metrics: unknown) {
  return geminiVisualErrorCodeFromMetrics(metrics) != null;
}

export function metricsShowPitchOverlaySkipped(metrics: unknown) {
  return pitchOverlaySkippedInMetrics(metrics);
}

function hasAnalysis(heard: TrainExtract | null, metrics: unknown) {
  if (heard) return true;
  return typeof metricsRow(metrics)?.duration_s === "number";
}

export function takeLogKind({
  job,
  heard,
  metrics,
}: {
  job: AnalyzeJobView | null;
  heard: TrainExtract | null;
  metrics: unknown;
}): TakeLogKind {
  if (!hasAnalysis(heard, metrics)) {
    if (!job) return "no_job";
    switch (job.status) {
      case "pending":
        return "queued";
      case "running":
        return "running";
      case "failed":
        return "failed";
      case "done":
        return "done_empty";
      default: {
        const never: never = job.status;
        return never;
      }
    }
  }
  const silence = takeSilenceRatio(metrics);
  if (silence !== null && silence >= SILENT_RATIO) return "silent";
  const notes = pitchNotesFromMetrics(metrics);
  const chords = heard ? chordsFromScore(heard) : [];
  if (metricsShowPitchOverlaySkipped(metrics)) return "pitch_error";
  if (notes.length === 0 && pitchErrorFromMetrics(metrics)) return "pitch_error";
  if (notes.length === 0 && chords.length === 0) return "no_notes";
  return "ready";
}

export type TakeLogView = {
  kind: TakeLogKind;
  line: string;
  /** Raw detail worth showing under the line: a job error or the pitch backend error. */
  detail: string | null;
  open: boolean;
};

export function takeLogView({
  job,
  heard,
  metrics,
  copy,
  now = Date.now(),
}: {
  job: AnalyzeJobView | null;
  heard: TrainExtract | null;
  metrics: unknown;
  copy: TakeLogCopy;
  now?: number;
}): TakeLogView {
  if (job && isOpenAnalyze(job.status) && job.updatedAt && serviceWaitTimedOut(job.updatedAt, ANALYZE_WAIT_MS, now)) {
    return { kind: "failed", line: copy.timedOut ?? copy.failed, detail: null, open: false };
  }
  const kind = takeLogKind({ job, heard, metrics });
  const attempts = String(job?.attempts ?? 0);
  switch (kind) {
    case "no_job":
      return { kind, line: copy.none, detail: null, open: false };
    case "queued":
      return { kind, line: copy.pending.replaceAll("{n}", attempts), detail: null, open: true };
    case "running":
      return { kind, line: copy.running.replaceAll("{n}", attempts), detail: null, open: true };
    case "failed":
      return { kind, line: copy.failed, detail: job?.lastError ?? null, open: false };
    case "done_empty":
      return { kind, line: copy.doneEmpty, detail: null, open: false };
    case "silent": {
      const pct = Math.round((takeSilenceRatio(metrics) ?? 1) * 100);
      return { kind, line: copy.silent.replaceAll("{pct}", String(pct)), detail: null, open: false };
    }
    case "pitch_error":
      return {
        kind,
        line: metricsShowPitchOverlaySkipped(metrics) ? copy.pitchOverlaySkipped : copy.pitchError,
        detail: metricsShowPitchOverlaySkipped(metrics) ? null : pitchErrorFromMetrics(metrics),
        open: false,
      };
    case "no_notes":
      return { kind, line: copy.noNotes, detail: null, open: false };
    case "ready": {
      const visualFailed = metricsShowGeminiVisualFailure(metrics);
      return {
        kind,
        line: visualFailed ? copy.visualFailed : "",
        detail: null,
        open: false,
      };
    }
    default: {
      const never: never = kind;
      return never;
    }
  }
}
