import { describe, expect, it } from "vitest";
import { GEMINI_VISUAL_ERROR_CODES, classifyGeminiVisualError, geminiVisualComplete } from "@/lib/gemini-visual";

describe("geminiVisualComplete", () => {
  it("accepts extract-only when the piece model is not ready", () => {
    expect(
      geminiVisualComplete({ heard_extract: { title: "T", sections: [] } }, null, false),
    ).toBe(true);
  });

  it("needs compare observations when a model exists", () => {
    expect(geminiVisualComplete({ heard_extract: { title: "T", sections: [] } }, null, true)).toBe(false);
    expect(
      geminiVisualComplete(
        { heard_extract: { title: "T", sections: [] } },
        { overallFit: 1, confidence: 1, positives: [], issues: [], nextPractice: "" },
        true,
      ),
    ).toBe(true);
  });
});

describe("classifyGeminiVisualError", () => {
  it("maps timeout and upload failures to stable codes", () => {
    expect(classifyGeminiVisualError(new Error("gemini upload timed out after 1000ms"))).toBe(
      GEMINI_VISUAL_ERROR_CODES.timed_out,
    );
    expect(classifyGeminiVisualError(new Error('{"error":{"code":404}}'))).toBe(
      GEMINI_VISUAL_ERROR_CODES.upload_failed,
    );
  });
});