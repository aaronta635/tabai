import { describe, expect, it } from "vitest";
import {
  CLAIMABLE_SUBMISSION_STATUSES,
  guardReply,
  pieceTitleResult,
  registerFieldErrors,
  requiredText,
} from "@/lib/forms";

describe("requiredText", () => {
  it("trims whitespace", () => {
    expect(requiredText("  song  ")).toBe("song");
  });

  it("treats spaces as empty", () => {
    expect(requiredText("   ")).toBe("");
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
