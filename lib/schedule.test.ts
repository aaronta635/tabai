import { describe, expect, it } from "vitest";
import {
  mondayOfWeekUtc,
  parseDatetimeLocal,
  parseWeekParam,
  slotStartsAt,
  toDatetimeLocalValue,
  weekParam,
} from "@/lib/schedule";

describe("schedule helpers", () => {
  it("anchors a week on Monday UTC", () => {
    const mon = mondayOfWeekUtc(new Date("2026-09-23T10:00:00Z"));
    expect(mon.toISOString()).toBe("2026-09-21T00:00:00.000Z");
  });

  it("round-trips datetime-local in UTC", () => {
    const raw = "2026-09-21T15:30";
    const parsed = parseDatetimeLocal(raw);
    expect(parsed?.toISOString()).toBe("2026-09-21T15:30:00.000Z");
    expect(toDatetimeLocalValue(parsed!)).toBe(raw);
  });

  it("parses week query param", () => {
    const start = parseWeekParam("2026-09-23");
    expect(weekParam(start)).toBe("2026-09-21");
  });

  it("builds slot start from grid coordinates", () => {
    const week = mondayOfWeekUtc(new Date("2026-09-23T00:00:00Z"));
    expect(slotStartsAt(week, 2, 9).toISOString()).toBe("2026-09-23T09:00:00.000Z");
  });
});
