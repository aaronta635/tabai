import { describe, expect, it } from "vitest";
import { analyzeAllowed, canSubmitPiece, shouldAttachTeacher } from "@/lib/demo-piece";
import { senderName } from "@/lib/demo-teacher";

describe("demo pieces", () => {
  it("lets any student send a take without an assignment", () => {
    expect(canSubmitPiece({ demo: true, otherClass: true, needsProfile: false, member: false })).toBe(true);
  });

  it("keeps a normal piece behind the studio", () => {
    expect(canSubmitPiece({ demo: false, otherClass: true, needsProfile: false, member: false })).toBe(false);
    expect(canSubmitPiece({ demo: false, otherClass: false, needsProfile: false, member: true })).toBe(true);
  });

  it("does not attach a student who practices a demo song", () => {
    expect(shouldAttachTeacher(true, null)).toBe(false);
    expect(shouldAttachTeacher(false, null)).toBe(true);
    expect(shouldAttachTeacher(false, "teacher-1")).toBe(false);
  });

  it("scores a demo take before the student is approved", () => {
    expect(analyzeAllowed(true, null)).toBe(true);
    expect(analyzeAllowed(false, null)).toBe(false);
    expect(analyzeAllowed(false, new Date())).toBe(true);
  });

  it("shows PARA on a demo song and the teacher's name on a class song", () => {
    expect(senderName("PARA practice", true)).toBe("PARA");
    expect(senderName("Minh", false)).toBe("Minh");
  });
});
