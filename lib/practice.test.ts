import { describe, expect, it } from "vitest";
import {
  activityStreak,
  dayKey,
  heatmapCounts,
  lastNDays,
  parseDueAt,
  parseSubmissionKind,
  pickAssignedPiece,
} from "@/lib/practice";

const noon = new Date("2026-09-20T12:00:00.000Z");

describe("practice dates", () => {
  it("keys a day in UTC", () => {
    expect(dayKey(noon)).toBe("2026-09-20");
  });

  it("lists the last n days ending today", () => {
    expect(lastNDays(3, noon)).toEqual(["2026-09-18", "2026-09-19", "2026-09-20"]);
  });

  it("counts a streak through yesterday if today is empty", () => {
    expect(
      activityStreak([new Date("2026-09-19T01:00:00.000Z"), new Date("2026-09-18T01:00:00.000Z")], noon),
    ).toBe(2);
  });

  it("counts a heatmap bucket", () => {
    const days = heatmapCounts([new Date("2026-09-20T08:00:00.000Z"), new Date("2026-09-20T09:00:00.000Z")], 2, noon);
    expect(days).toEqual([
      { day: "2026-09-19", count: 0 },
      { day: "2026-09-20", count: 2 },
    ]);
  });
});

describe("pickAssignedPiece", () => {
  it("picks the soonest upcoming due date", () => {
    const soon = { dueAt: new Date("2026-09-21T23:59:59.000Z"), createdAt: new Date("2026-09-01") };
    const later = { dueAt: new Date("2026-09-28T23:59:59.000Z"), createdAt: new Date("2026-09-10") };
    expect(pickAssignedPiece([later, soon], noon)).toBe(soon);
  });

  it("falls back to the newest undated piece", () => {
    const older = { dueAt: null, createdAt: new Date("2026-09-01") };
    const newer = { dueAt: null, createdAt: new Date("2026-09-10") };
    expect(pickAssignedPiece([older, newer], noon)).toBe(newer);
  });
});

describe("parseDueAt", () => {
  it("parses a calendar day as UTC end of day", () => {
    expect(parseDueAt("2026-09-20")?.toISOString()).toBe("2026-09-20T23:59:59.000Z");
  });

  it("rejects junk", () => {
    expect(parseDueAt("tomorrow")).toBeNull();
    expect(parseDueAt("")).toBeNull();
  });
});

describe("parseSubmissionKind", () => {
  it("defaults unknown values to take", () => {
    expect(parseSubmissionKind("practice")).toBe("practice");
    expect(parseSubmissionKind("nope")).toBe("take");
  });
});
