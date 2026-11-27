import { describe, expect, it } from "vitest";
import { promoteGeminiFollowUpEligible } from "@/lib/jobs-promote-followup";

describe("analyze worker follow-up policy", () => {
  it("never chains a follow-up off another promote follow-up job", () => {
    expect(
      promoteGeminiFollowUpEligible({
        finishingStartedAsPractice: true,
        finishingWasPromoteFollowUp: true,
      }),
    ).toBe(false);
  });

  it("does not enqueue without practice origin or promotion context", () => {
    expect(promoteGeminiFollowUpEligible({ finishingStartedAsPractice: false })).toBe(false);
  });
});