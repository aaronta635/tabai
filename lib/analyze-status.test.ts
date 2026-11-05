import { describe, expect, it } from "vitest";
import { analyzeStatusLine, type AnalyzeStatusCopy } from "@/lib/analyze-status";

const copy: AnalyzeStatusCopy = {
  pending: "Queued. Attempt {n}.",
  running: "Analyzing. Attempt {n}.",
  failed: "Analysis failed.",
  none: "No analyze job.",
  doneEmpty: "Finished with no chart.",
};

describe("analyze status line", () => {
  it("says when the worker has not started", () => {
    expect(
      analyzeStatusLine({ status: "pending", attempts: 0, lastError: null, updatedAt: "" }, copy),
    ).toBe("Queued. Attempt 0.");
  });

  it("says when a worker is in the take", () => {
    expect(
      analyzeStatusLine({ status: "running", attempts: 1, lastError: null, updatedAt: "" }, copy),
    ).toBe("Analyzing. Attempt 1.");
  });

  it("says when nothing was queued", () => {
    expect(analyzeStatusLine(null, copy)).toBe("No analyze job.");
  });
});
