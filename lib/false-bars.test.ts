import { describe, expect, it } from "vitest";
import { falseBarReport, markedBarsFromAnalysis } from "@/lib/false-bars";

describe("falseBarReport", () => {
  it("counts Sai over marked bars and ignores unmarked ones", () => {
    const rows = markedBarsFromAnalysis({
      pieceTitle: "Season",
      metrics: { pitch_overlay_version: "pitch-overlay-v6" },
      observations: {
        overallFit: 0.5,
        confidence: 0.8,
        positives: [],
        nextPractice: "",
        issues: [
          { type: "pitch", tStart: 1, expected: "C4", observed: "D4", confidence: 0.8, verdict: "false" },
          { type: "pitch", tStart: 2, expected: "E4", observed: "E4", confidence: 0.8, verdict: "true" },
          { type: "chord", tStart: 4, expected: "Am", observed: "A7", confidence: 0.8, verdict: "false" },
          { type: "timing", tStart: 6, expected: "on 1", observed: "late", confidence: 0.8, verdict: null },
        ],
      },
    });
    const report = falseBarReport(rows);
    const pitch = report.find((group) => group.type === "pitch");
    expect(pitch).toMatchObject({ pieceTitle: "Season", overlayVersion: "pitch-overlay-v6", trueCount: 1, falseCount: 1, falseRate: 0.5 });
    expect(report.find((group) => group.type === "chord")?.falseRate).toBe(1);
    expect(report.some((group) => group.type === "timing")).toBe(false);
  });
});
