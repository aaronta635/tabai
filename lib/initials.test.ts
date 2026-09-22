import { describe, expect, it } from "vitest";
import { initialsOf } from "@/lib/initials";

describe("initialsOf", () => {
  it("takes the family name and the given name", () => {
    expect(initialsOf("Nguyễn Tài An")).toBe("NA");
  });

  it("uses two letters when there is one word", () => {
    expect(initialsOf("an")).toBe("AN");
  });

  it("falls back when the name is blank", () => {
    expect(initialsOf("   ")).toBe("?");
  });
});
