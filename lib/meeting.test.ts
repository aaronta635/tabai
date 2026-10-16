import { describe, expect, it } from "vitest";
import { meetingLink } from "@/lib/meeting";
import { sessionOccurrences } from "@/lib/schedule";

describe("meetingLink", () => {
  it("accepts a Meet or Zoom https link for the chosen room", () => {
    expect(meetingLink("google_meet", "https://meet.google.com/abc-defg-hij")).toEqual({
      provider: "google_meet",
      url: "https://meet.google.com/abc-defg-hij",
    });
    expect(meetingLink("zoom", "https://us02web.zoom.us/j/123")).toMatchObject({ provider: "zoom" });
  });

  it("rejects a missing link and a link for the other room", () => {
    expect(meetingLink("zoom", "")).toBeUndefined();
    expect(meetingLink("google_meet", "https://zoom.us/j/1")).toBeUndefined();
    expect(meetingLink("", "")).toBeNull();
  });
});

describe("sessionOccurrences", () => {
  it("keeps the same clock time across weekly copies", () => {
    const start = new Date("2026-10-05T09:00:00Z");
    const end = new Date("2026-10-05T10:00:00Z");
    const rows = sessionOccurrences(start, end, 3);
    expect(rows).toHaveLength(3);
    expect(rows[2]?.startsAt.toISOString()).toBe("2026-10-19T09:00:00.000Z");
    expect(rows[2]?.endsAt?.toISOString()).toBe("2026-10-19T10:00:00.000Z");
  });
});
