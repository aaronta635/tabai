import { describe, expect, it } from "vitest";
import { classifyReplySource, editDistance } from "@/lib/edit-distance";

describe("editDistance", () => {
  it("is zero for the same text", () => {
    expect(editDistance("keep the beat", "keep the beat")).toBe(0);
  });

  it("counts substitutions", () => {
    expect(editDistance("cat", "bat")).toBe(1);
  });
});

describe("classifyReplySource", () => {
  it("marks no draft as manual", () => {
    expect(classifyReplySource(null, "hello")).toEqual({ source: "manual", editDistance: null });
  });

  it("marks an unchanged draft as approved", () => {
    expect(classifyReplySource("hello", "hello")).toEqual({ source: "approved_draft", editDistance: 0 });
  });

  it("marks a changed draft as edited", () => {
    expect(classifyReplySource("hello", "hello!")).toEqual({ source: "edited_draft", editDistance: 1 });
  });
});
