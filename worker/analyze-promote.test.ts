import { describe, expect, it } from "vitest";
import { needsGeminiCatchUpAfterPromotion } from "./analyze";

describe("needsGeminiCatchUpAfterPromotion", () => {
  it("runs Gemini when a practice job was promoted to a take before save", () => {
    expect(needsGeminiCatchUpAfterPromotion(true, "take")).toBe(true);
    expect(needsGeminiCatchUpAfterPromotion(true, "overdub")).toBe(true);
  });

  it("skips catch-up when the clip is still practice or started as a take", () => {
    expect(needsGeminiCatchUpAfterPromotion(true, "practice")).toBe(false);
    expect(needsGeminiCatchUpAfterPromotion(false, "take")).toBe(false);
  });
});