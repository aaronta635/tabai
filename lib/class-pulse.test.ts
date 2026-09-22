import { describe, expect, it } from "vitest";
import { classPulseHeadline, topIssueBars } from "@/lib/class-pulse";

describe("topIssueBars", () => {
  it("counts unique students per bar and ignores weak issues", () => {
    const bars = topIssueBars([
      {
        studentId: "a",
        issues: [
          { bar: 7, confidence: 0.9 },
          { bar: 7, confidence: 0.95 },
        ],
      },
      { studentId: "b", issues: [{ bar: 7, confidence: 0.8 }] },
      { studentId: "c", issues: [{ bar: 3, confidence: 0.2 }] },
    ]);
    expect(bars).toEqual([{ bar: 7, count: 2 }]);
  });
});

describe("classPulseHeadline", () => {
  it("names the shared bar in English", () => {
    expect(
      classPulseHeadline({ locale: "en", takes: 4, students: 3, topBar: { bar: 7, count: 2 } }),
    ).toBe("2/3 students late at bar 7 this week.");
  });

  it("falls back when nothing is shared", () => {
    expect(classPulseHeadline({ locale: "en", takes: 4, students: 3, topBar: null })).toBe(
      "4 takes from 3 students this week. No shared bar yet.",
    );
  });
});
