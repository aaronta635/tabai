import { describe, expect, it } from "vitest";
import type { AnalyzeJobView } from "@/lib/analyze-status";
import { ANALYZE_WAIT_MS } from "@/lib/constants";
import { takeLogKind, takeLogView, type TakeLogCopy } from "@/lib/take-log";
import { parseTrainExtract } from "@/lib/score-model";

const copy: TakeLogCopy = {
  pending: "Queued {n}",
  running: "Running {n}",
  failed: "Failed",
  none: "No job",
  doneEmpty: "Done, no chart",
  silent: "Silent {pct}%",
  noNotes: "No notes",
  pitchError: "Pitch error",
  visualFailed: "Visual failed",
  pitchOverlaySkipped: "Pitch overlay skipped",
};

const job = (status: AnalyzeJobView["status"], lastError: string | null = null): AnalyzeJobView => ({
  status,
  attempts: 2,
  lastError,
  updatedAt: "",
});

const emptyHeard = parseTrainExtract({ key: "Unknown", sections: [{ name: "Performance", chords: [], melodyNotes: [] }] });
const chordHeard = parseTrainExtract({
  key: "G",
  sections: [{ name: "Performance", chords: ["G"], melodyNotes: [] }],
});
const note = { tStart: 0, tEnd: 0.5, midi: 60 };
const audible = { duration_s: 5, silence_ratio: 0.2 };

describe("take log", () => {
  it("has no job and no analysis", () => {
    expect(takeLogKind({ job: null, heard: null, metrics: null })).toBe("no_job");
  });

  it("stops the analyze spinner after the Gemini video wait, not at one minute", () => {
    const started = Date.parse("2026-11-20T00:00:00.000Z");
    const stale = {
      ...job("running"),
      updatedAt: new Date(started).toISOString(),
    };
    expect(
      takeLogView({
        job: stale,
        heard: null,
        metrics: null,
        copy: { ...copy, timedOut: "Took too long" },
        now: started + 60_000,
      }),
    ).toMatchObject({ kind: "running", line: "Running 2", open: true });
    expect(
      takeLogView({
        job: stale,
        heard: null,
        metrics: null,
        copy: { ...copy, timedOut: "Took too long" },
        now: started + ANALYZE_WAIT_MS,
      }),
    ).toMatchObject({ kind: "failed", line: "Took too long", open: false });
  });

  it("is queued, then running", () => {
    expect(takeLogView({ job: job("pending"), heard: null, metrics: null, copy })).toMatchObject({
      kind: "queued",
      line: "Queued 2",
      open: true,
    });
    expect(takeLogView({ job: job("running"), heard: null, metrics: null, copy })).toMatchObject({
      kind: "running",
      line: "Running 2",
      open: true,
    });
  });

  it("surfaces a Gemini visual failure without raw json in the headline", () => {
    const heard = chordHeard;
    const metrics = {
      ...audible,
      pitch_notes: [note],
      gemini_visual_error: "Gemini file upload failed.",
    };
    expect(takeLogView({ job: job("done"), heard, metrics, copy })).toMatchObject({
      kind: "ready",
      line: "Visual failed",
      detail: "Gemini file upload failed.",
    });
  });

  it("shows the job error when the worker failed", () => {
    expect(takeLogView({ job: job("failed", "boom"), heard: null, metrics: null, copy })).toMatchObject({
      kind: "failed",
      detail: "boom",
    });
  });

  it("says a finished job wrote nothing", () => {
    expect(takeLogKind({ job: job("done"), heard: null, metrics: null })).toBe("done_empty");
  });

  it("calls a quiet take silent with its percentage", () => {
    const metrics = { duration_s: 5.1, silence_ratio: 1, pitch_notes: [] };
    expect(takeLogView({ job: job("done"), heard: emptyHeard, metrics, copy })).toMatchObject({
      kind: "silent",
      line: "Silent 100%",
    });
  });

  it("shows the pitch backend error when nothing was heard", () => {
    const metrics = { ...audible, pitch_notes: [], pitch_error: "model missing" };
    expect(takeLogView({ job: job("done"), heard: emptyHeard, metrics, copy })).toMatchObject({
      kind: "pitch_error",
      detail: "model missing",
    });
  });

  it("says audible sound with no chords or notes found nothing", () => {
    expect(takeLogKind({ job: job("done"), heard: emptyHeard, metrics: { ...audible, pitch_notes: [] } })).toBe("no_notes");
  });

  it("is ready once chords or notes exist", () => {
    expect(takeLogKind({ job: job("done"), heard: chordHeard, metrics: audible })).toBe("ready");
    expect(takeLogKind({ job: job("done"), heard: emptyHeard, metrics: { ...audible, pitch_notes: [note] } })).toBe("ready");
  });
});
