import { describe, expect, it } from "vitest";
import { tempoCue } from "@/lib/tempo-cue";

describe("tempoCue", () => {
  it("stays quiet inside 12 percent", () => {
    expect(tempoCue(80, 88)).toBeNull();
    expect(tempoCue(100, 90)).toBeNull();
    expect(tempoCue(null, 40)).toBeNull();
  });

  it("asks for a slower take when the student is more than 12 percent fast", () => {
    expect(tempoCue(80, 90)).toMatch(/đánh chậm lại/);
    expect(tempoCue(80, 90, "en")).toMatch(/slow down/);
  });

  it("does not ask a slower student to speed up unless the piece allows it", () => {
    expect(tempoCue(100, 80)).toBeNull();
    expect(tempoCue(100, 80, "en", { allowFaster: true })).toMatch(/play faster/);
    expect(tempoCue(100, 80, "vi", { allowFaster: true })).toMatch(/đánh nhanh hơn/);
  });
});
