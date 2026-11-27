import { describe, expect, it } from "vitest";
import { PITCH_CHECK_WAIT_MS } from "@/lib/constants";
import { pitchCheckStillWaiting, pitchCheckTimedOut, studentPitchCopy, toStudentPitchClip } from "@/lib/student-pitch";

const copy = studentPitchCopy({
  practiceQueued: "Queued {n}",
  practiceRunning: "Running {n}",
  practiceFailed: "Failed",
  practiceNone: "None",
  practiceDoneEmpty: "Empty",
  practiceSilent: "Silent {pct}",
  practiceNoNotes: "No notes",
  practicePitchError: "Pitch error",
  practiceCouldNotJudge: "Could not judge",
});

describe("pitchCheckTimedOut", () => {
  const start = new Date("2026-11-20T00:00:00.000Z");

  it("waits a full minute before giving up on a practice pitch check", () => {
    expect(pitchCheckTimedOut(start, start.getTime() + PITCH_CHECK_WAIT_MS - 1)).toBe(false);
    expect(pitchCheckTimedOut(start, start.getTime() + PITCH_CHECK_WAIT_MS)).toBe(true);
  });

  it("keeps the spinner only while the job is open and inside the wait", () => {
    const job = { status: "running" as const, attempts: 1, lastError: null, updatedAt: start.toISOString() };
    expect(pitchCheckStillWaiting(job, start, start.getTime() + 10_000)).toBe(true);
    expect(pitchCheckStillWaiting(job, start, start.getTime() + PITCH_CHECK_WAIT_MS)).toBe(false);
    expect(pitchCheckStillWaiting({ ...job, status: "done" }, start, start.getTime() + 10_000)).toBe(false);
  });
});

describe("toStudentPitchClip", () => {
  it("surfaces pitch notes and a weak judge for the practice chart", () => {
    const clip = toStudentPitchClip({
      id: "sub-1",
      kind: "practice",
      submittedAt: new Date("2026-11-20T00:00:00.000Z"),
      metricsJson: {
        duration_s: 8,
        tempo_bpm: 92,
        pitch_notes: [{ tStart: 1.2, tEnd: 1.5, midi: 60, name: "C4" }],
      },
      observationsJson: {
        overallFit: 0.4,
        confidence: 0.5,
        positives: [],
        issues: [],
        nextPractice: "",
        pitchJudge: "weak",
      },
      job: { status: "done", attempts: 1, lastError: null, updatedAt: new Date("2026-11-20T00:01:00.000Z") },
      copy,
    });
    expect(clip.kind).toBe("practice");
    expect(clip.tempoBpm).toBe(92);
    expect(clip.pitchJudge).toBe("weak");
    expect(clip.notes).toEqual([{ tStart: 1.2, tEnd: 1.5, midi: 60, name: "C4" }]);
    expect(clip.log.open).toBe(false);
  });
});
