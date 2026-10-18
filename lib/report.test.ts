import { describe, expect, it } from "vitest";
import { highlightStart, joinStoryLetter, milestoneOf, reportStories, safePaymentUrl, weekLabel } from "@/lib/report";

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

describe("reportStories", () => {
  const copy = {
    storyPractice: "How many times did you practice",
    storyHighlight: "Highlight of the week",
    storyProgress: "How did you progress",
    storyKey: "Key point",
    storyNext: "Next step",
    practiceMix: "{practices} practice logs · {takes} videos",
    noPractice: "No practice logged this week.",
    noHighlight: "No highlight this week.",
    noProgress: "No progress line this week.",
    noKey: "No key point this week.",
    noNext: "No next step this week.",
  };

  it("counts practice and uses the lines the teacher wrote", () => {
    const stories = reportStories(
      {
        practices: 2,
        takes: 1,
        highlightStart: 12.4,
        progress: "The chorus sits in time.",
        keyPoint: "Keep the wrist relaxed.",
        nextStep: "Play the verse once slowly.",
      },
      copy,
    );
    expect(stories.map((story) => story.id)).toEqual(["practice", "highlight", "progress", "key", "next"]);
    expect(stories[0]?.hero).toBe("3");
    expect(stories[1]?.videoStart).toBe(12.4);
    expect(stories[1]?.hero).toBe("");
    expect(stories[2]?.hero).toBe("The chorus sits in time.");
    expect(stories[3]?.hero).toBe("Keep the wrist relaxed.");
    expect(stories[4]?.hero).toBe("Play the verse once slowly.");
    expect(stories[2]?.videoStart).toBeNull();
  });

  it("leaves a quiet line when the teacher has not written the story", () => {
    const stories = reportStories(
      { practices: 0, takes: 0, highlightStart: null, progress: null, keyPoint: "  ", nextStep: null },
      copy,
    );
    expect(stories[1]?.hero).toBe("No highlight this week.");
    expect(stories[1]?.videoStart).toBeNull();
    expect(stories[3]?.hero).toBe("No key point this week.");
  });
});

describe("joinStoryLetter", () => {
  it("joins the three lines and drops blanks", () => {
    expect(joinStoryLetter({ progress: " In time. ", keyPoint: "", nextStep: "Slow verse." })).toBe("In time.\n\nSlow verse.");
    expect(joinStoryLetter({ progress: " ", keyPoint: null, nextStep: "" })).toBe("");
  });
});

describe("highlightStart", () => {
  it("keeps a start time inside the take", () => {
    expect(highlightStart(12.44)).toBe(12.4);
    expect(highlightStart(0)).toBe(0);
    expect(highlightStart(-1)).toBeNull();
    expect(highlightStart(60 * 60 + 1)).toBeNull();
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
