import { describe, expect, it } from "vitest";
import { routeSubmission, shouldUnlockAiDirect, wallVisible } from "@/lib/growth";

describe("growth gates", () => {
  it("unlocks AI-direct only after volume and untouched drafts", () => {
    expect(shouldUnlockAiDirect({ repliesOnPiece: 99, approveUntouchedLast50: 1 })).toBe(false);
    expect(shouldUnlockAiDirect({ repliesOnPiece: 100, approveUntouchedLast50: 0.79 })).toBe(false);
    expect(shouldUnlockAiDirect({ repliesOnPiece: 100, approveUntouchedLast50: 0.8 })).toBe(true);
  });

  it("keeps low-confidence takes on the teacher queue", () => {
    expect(routeSubmission({ aiDirectUnlockedAt: new Date(), confidence: 0.79 })).toBe("teacher");
    expect(routeSubmission({ aiDirectUnlockedAt: new Date(), confidence: 0.8 })).toBe("ai_direct");
    expect(routeSubmission({ aiDirectUnlockedAt: null, confidence: 0.99 })).toBe("teacher");
  });

  it("hides under-18 takes from the wall", () => {
    expect(wallVisible({ publicOk: true, ageBand: "under18", teacherPick: true })).toBe(false);
    expect(wallVisible({ publicOk: true, ageBand: "adult", teacherPick: true })).toBe(true);
  });
});
