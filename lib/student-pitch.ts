import type { SubmissionKind } from "@prisma/client";
import { isOpenAnalyze, toAnalyzeJobView, type AnalyzeJobView } from "@/lib/analyze-status";
import { PITCH_CHECK_WAIT_MS } from "@/lib/constants";
import { pitchErrorFromMetrics, pitchNotesFromMetrics, type HeardPitchNote } from "@/lib/pitch-overlay";
import { factBarLabel, parseCompareObservations } from "@/lib/score-model";
import { serviceWaitElapsedMs, serviceWaitTimedOut } from "@/lib/service-wait";
import { takeLogView, type TakeLogCopy, type TakeLogView } from "@/lib/take-log";

export type StudentPitchClip = {
  id: string;
  kind: SubmissionKind;
  submittedAt: string;
  job: AnalyzeJobView | null;
  notes: HeardPitchNote[];
  pitchError: string | null;
  pitchJudge: "ok" | "weak" | null;
  tempoBpm: number | null;
  issues: { type: string; label: string }[];
  log: TakeLogView;
};

export function pitchCheckElapsedMs(startedAt: Date | string, now = Date.now()) {
  return serviceWaitElapsedMs(startedAt, now);
}

export function pitchCheckTimedOut(startedAt: Date | string, now = Date.now()) {
  return serviceWaitTimedOut(startedAt, PITCH_CHECK_WAIT_MS, now);
}

export function pitchCheckStillWaiting(job: AnalyzeJobView | null | undefined, startedAt: Date | string, now = Date.now()) {
  return isOpenAnalyze(job?.status) && !pitchCheckTimedOut(startedAt, now);
}

export function studentPitchCopy(t: {
  practiceQueued: string;
  practiceRunning: string;
  practiceFailed: string;
  practiceNone: string;
  practiceDoneEmpty: string;
  practiceSilent: string;
  practiceNoNotes: string;
  practicePitchError: string;
}): TakeLogCopy {
  return {
    pending: t.practiceQueued,
    running: t.practiceRunning,
    failed: t.practiceFailed,
    none: t.practiceNone,
    doneEmpty: t.practiceDoneEmpty,
    silent: t.practiceSilent,
    noNotes: t.practiceNoNotes,
    pitchError: t.practicePitchError,
    visualFailed: t.practiceCouldNotJudge,
    pitchOverlaySkipped: t.practicePitchError,
  };
}

export function toStudentPitchClip(input: {
  id: string;
  kind: SubmissionKind;
  submittedAt: Date;
  metricsJson: unknown;
  observationsJson: unknown;
  job: { status: string; attempts: number; lastError: string | null; updatedAt: Date } | null;
  copy: TakeLogCopy;
}): StudentPitchClip {
  const metrics = input.metricsJson;
  const observations = input.observationsJson != null ? parseCompareObservations(input.observationsJson) : null;
  const job = toAnalyzeJobView(input.job);
  const tempo =
    metrics && typeof metrics === "object" && !Array.isArray(metrics)
      ? (metrics as { tempo_bpm?: unknown }).tempo_bpm
      : null;
  return {
    id: input.id,
    kind: input.kind,
    submittedAt: input.submittedAt.toISOString(),
    job,
    notes: pitchNotesFromMetrics(metrics),
    pitchError: pitchErrorFromMetrics(metrics),
    pitchJudge: observations?.pitchJudge ?? null,
    tempoBpm: typeof tempo === "number" ? tempo : null,
    issues: (observations?.issues ?? []).map((issue) => ({ type: issue.type, label: factBarLabel(issue) })),
    log: takeLogView({ job, heard: null, metrics, copy: input.copy }),
  };
}
