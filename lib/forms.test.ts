import { describe, expect, it } from "vitest";
import {
  CLAIMABLE_SUBMISSION_STATUSES,
  guardReply,
  statusAfterRevert,
  isClaimableStatus,
  pieceTitleResult,
  registerFieldErrors,
  replyGrade,
  requiredText,
  submissionNote,
} from "@/lib/forms";

describe("requiredText", () => {
  it("trims whitespace", () => {
    expect(requiredText("  song  ")).toBe("song");
  });

  it("treats spaces as empty", () => {
    expect(requiredText("   ")).toBe("");
  });

  it("keeps a submission note or leaves it unset", () => {
    expect(submissionNote("  bars 12–16 rushed  ")).toBe("bars 12–16 rushed");
    expect(submissionNote("   ")).toBeNull();
    expect(submissionNote(null)).toBeNull();
    expect(submissionNote("x".repeat(801))).toBeUndefined();
  });
});

describe("pieceTitleResult", () => {
  it("rejects a space-only title", () => {
    expect(pieceTitleResult("   ")).toEqual({ error: "title_required" });
  });

  it("keeps a real title", () => {
    expect(pieceTitleResult("  Easy 1 ")).toEqual({ title: "Easy 1" });
  });
});

describe("replyGrade", () => {
  it("keeps A–F and drops an empty mark", () => {
    expect(replyGrade(" b ")).toBe("B");
    expect(replyGrade("")).toBeNull();
    expect(replyGrade("E")).toBeUndefined();
  });
});

describe("guardReply", () => {
  it("rejects an empty or whitespace reply", () => {
    expect(guardReply({ text: "  ", status: "new", existingReplyCount: 0 })).toEqual({
      error: "empty_reply",
    });
  });

  it("rejects an already answered item", () => {
    expect(guardReply({ text: "ok", status: "answered", existingReplyCount: 0 })).toEqual({
      error: "stale_item",
    });
  });

  it("rejects when a reply already exists", () => {
    expect(guardReply({ text: "ok", status: "drafted", existingReplyCount: 1 })).toEqual({
      error: "stale_item",
    });
  });

  it("accepts a claimable draft", () => {
    expect(guardReply({ text: "  keep the beat  ", status: "drafted", existingReplyCount: 0 })).toEqual({
      text: "keep the beat",
    });
    expect(CLAIMABLE_SUBMISSION_STATUSES).toContain("drafted");
  });

  it("returns a taken-back reply to the draft desk when a draft remains", () => {
    expect(statusAfterRevert(true)).toBe("drafted");
    expect(statusAfterRevert(false)).toBe("new");
  });

  it("treats only new and drafted takes as claimable", () => {
    expect(isClaimableStatus("new")).toBe(true);
    expect(isClaimableStatus("drafted")).toBe(true);
    expect(isClaimableStatus("answered")).toBe(false);
    expect(isClaimableStatus("skipped")).toBe(false);
  });
});

describe("registerFieldErrors", () => {
  it("flags whitespace name and contact", () => {
    const result = registerFieldErrors({
      name: "  ",
      contactHandle: "   ",
      ageBand: "adult",
      contactType: "zalo",
      consent: true,
    });
    expect(result.missing).toBe(true);
    expect(result.fields).toEqual({ name: true, contactHandle: true });
  });

  it("passes a complete profile", () => {
    const result = registerFieldErrors({
      name: " An ",
      contactHandle: " 0909 ",
      ageBand: "adult",
      contactType: "zalo",
      consent: true,
    });
    expect(result.missing).toBe(false);
    expect(result.name).toBe("An");
    expect(result.contactHandle).toBe("0909");
  });
});
