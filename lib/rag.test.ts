import { describe, expect, it } from "vitest";
import { metricGuidance, observationOutline } from "@/lib/rag";
import type { CompareObservations } from "@/lib/score-model";

const close: CompareObservations = {
  overallFit: 0.96,
  confidence: 0.9,
  positives: ["Steady Am at 0:04"],
  issues: [],
  nextPractice: "",
};

describe("observationOutline", () => {
  it("bans silence, rhythm, and emotion padding when there is no compare", () => {
    const text = observationOutline(null);
    expect(text).toMatch(/Không có đối chiếu/);
    expect(text).toMatch(/khoảng lặng/);
    expect(text).toMatch(/cảm xúc/);
    expect(text).toMatch(/silence_ratio/);
  });

  it("asks for praise-only facts on a close match", () => {
    const text = observationOutline(close);
    expect(text).toMatch(/không bịa điểm sửa/);
    expect(text).toMatch(/Steady Am at 0:04/);
  });

  it("lists only teacher-true issues after verdicts", () => {
    const text = observationOutline({
      overallFit: 0.5,
      confidence: 0.8,
      positives: ["clean run at 0:01"],
      nextPractice: "",
      issues: [
        {
          type: "pitch",
          bar: null,
          tStart: 5,
          tEnd: null,
          expected: "G#4",
          observed: "A#4",
          confidence: 0.9,
          verdict: "true",
        },
        {
          type: "technique",
          bar: null,
          tStart: 12,
          tEnd: null,
          expected: "pressure",
          observed: "choke",
          confidence: 0.4,
          verdict: "false",
        },
      ],
    });
    expect(text).toMatch(/G#4/);
    expect(text).not.toMatch(/choke/);
  });
});

describe("metricGuidance", () => {
  it("forbids turning loudness numbers into mistakes without compare", () => {
    const text = metricGuidance({ silence_ratio: 0.7, tempo_stability: 0.8 }, null);
    expect(text).toMatch(/Không có đối chiếu/);
    expect(text).not.toMatch(/Nhịp không đều/);
    expect(text).not.toMatch(/Nhiều khoảng lặng/);
  });

  it("still forbids metric-invented timing on a close match", () => {
    const text = metricGuidance({ tempo_stability: 0.9 }, close);
    expect(text).toMatch(/Cấm dùng tempo_stability/);
  });
});
