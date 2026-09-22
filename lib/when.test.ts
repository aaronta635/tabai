import { describe, expect, it } from "vitest";
import { formatDay, formatWhen } from "@/lib/when";

const evening = new Date("2026-09-24T18:30:00.000Z");

describe("formatWhen", () => {
  it("keeps the stored UTC clock time", () => {
    expect(formatWhen(evening, "en")).toContain("18:30");
  });

  it("leads with the day in Vietnamese too", () => {
    expect(formatWhen(evening, "vi").startsWith("24")).toBe(true);
  });

  it("writes day and month without a year", () => {
    expect(formatDay(evening, "en")).toMatch(/^24 Sept?$/);
  });
});
