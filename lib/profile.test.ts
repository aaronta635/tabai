import { describe, expect, it } from "vitest";
import { allowList, oneOf, SKILLS, stringList, WEAKNESSES } from "@/lib/profile";

describe("profile picks", () => {
  it("keeps only known skills", () => {
    expect(allowList(["rhythm", "drums", "chords"], SKILLS)).toEqual(["rhythm", "chords"]);
  });

  it("falls back when a single choice is unknown", () => {
    expect(oneOf("decades", ["weeks", "months", "years"], "months")).toBe("months");
  });

  it("reads stored weakness lists", () => {
    expect(stringList(["timing", "nope"], WEAKNESSES)).toEqual(["timing"]);
    expect(stringList("timing", WEAKNESSES)).toEqual([]);
  });
});
