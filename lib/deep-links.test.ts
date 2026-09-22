import { describe, expect, it } from "vitest";
import { messengerNudgeLink, nudgeHref, zaloNudgeLink } from "@/lib/deep-links";

describe("nudge links", () => {
  it("builds a Zalo phone link", () => {
    expect(zaloNudgeLink("+84 909 111")).toBe("https://zalo.me/84909111");
  });

  it("builds a Messenger handle link", () => {
    expect(messengerNudgeLink("@studio")).toBe("https://m.me/studio");
  });

  it("returns null without a handle", () => {
    expect(nudgeHref("zalo", null)).toBeNull();
    expect(nudgeHref("messenger", "https://m.me/x")).toBe("https://m.me/x");
  });
});
