import { describe, expect, it } from "vitest";
import { milestoneOf, safePaymentUrl, weekLabel } from "@/lib/report";

describe("milestoneOf", () => {
  it("stays quiet until the first take", () => {
    expect(milestoneOf({ takes: 0, replies: 0, streak: 0 })).toBeNull();
    expect(milestoneOf({ takes: 0, replies: 0, streak: 2 })).toBeNull();
  });

  it("prefers a 3-day streak, then the first reply, then the first take", () => {
    expect(milestoneOf({ takes: 4, replies: 2, streak: 3 })).toBe("streak_3");
    expect(milestoneOf({ takes: 2, replies: 1, streak: 1 })).toBe("first_reply");
    expect(milestoneOf({ takes: 1, replies: 0, streak: 1 })).toBe("first_take");
  });
});

describe("weekLabel", () => {
  it("labels Monday through Sunday", () => {
    expect(weekLabel(new Date("2026-10-12T00:00:00.000Z"), "en")).toBe("12 Oct – 18 Oct");
  });
});

describe("safePaymentUrl", () => {
  it("keeps http(s) links and drops anything else", () => {
    expect(safePaymentUrl(" https://pay.example/abc ")).toBe("https://pay.example/abc");
    expect(safePaymentUrl("")).toBeNull();
    expect(safePaymentUrl("javascript:alert(1)")).toBeNull();
    expect(safePaymentUrl("not a url")).toBeNull();
  });
});
