import { describe, expect, it } from "vitest";
import { weekPractice } from "@/lib/practice-week";

describe("weekPractice", () => {
  it("fills Monday and Wednesday of the current UTC week", () => {
    const now = new Date("2026-09-30T12:00:00Z");
    const result = weekPractice(
      [
        { seconds: 600, startedAt: new Date("2026-09-28T08:00:00Z") },
        { seconds: 1200, startedAt: new Date("2026-09-30T08:00:00Z") },
        { seconds: 9999, startedAt: new Date("2026-09-20T08:00:00Z") },
      ],
      now,
    );
    expect(result.totalMinutes).toBe(30);
    expect(result.heights[0]).toBe(50);
    expect(result.heights[2]).toBe(100);
    expect(result.heights[1]).toBe(0);
  });
});
