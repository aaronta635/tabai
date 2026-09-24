import { describe, expect, it } from "vitest";
import { overlayPitchIssues } from "@/lib/pitch-overlay";
import type { CompareObservations, ScoreJson } from "@/lib/score-model";

const emptyObs: CompareObservations = {
  overallFit: 0.7,
  confidence: 0.8,
  positives: ["steady intro"],
  nextPractice: "slow",
  issues: [
    {
      type: "pitch",
      bar: 1,
      tStart: 1,
      tEnd: null,
      expected: "C4",
      observed: "guess",
      confidence: 0.9,
    },
    {
      type: "timing",
      bar: null,
      tStart: 2,
      tEnd: null,
      expected: "on 1",
      observed: "late",
      confidence: 0.8,
    },
  ],
};

const score: ScoreJson = {
  title: "Test",
  key: "C",
  tempoBpm: 80,
  timeSignature: "4/4",
  barCount: 4,
  sections: [{ name: "A", startBar: 1, endBar: 2, chords: [], melodyNotes: ["C4", "E4"], lyrics: null }],
  techniqueFocus: [],
  commonMistakes: [],
};

describe("overlayPitchIssues", () => {
  it("keeps timing issues and replaces pitch from heard MIDI", () => {
    const next = overlayPitchIssues(
      emptyObs,
      [
        { tStart: 0.5, tEnd: 1, midi: 60, name: "C4" },
        { tStart: 1.2, tEnd: 1.6, midi: 62, name: "D4" },
      ],
      score,
    );
    expect(next.issues.some((issue) => issue.type === "timing")).toBe(true);
    const pitch = next.issues.filter((issue) => issue.type === "pitch");
    expect(pitch).toHaveLength(1);
    expect(pitch[0]?.expected).toBe("E4");
    expect(pitch[0]?.observed).toBe("D4");
  });
});
