import { describe, expect, it } from "vitest";
import { notePositionLabel, parseFretRead } from "@/lib/fretboard";

describe("notePositionLabel", () => {
  it("keeps the note name and adds the fret when the frame is clear", () => {
    expect(notePositionLabel({ midi: 60, name: "C4", fret: 1, visible: true })).toBe("C4 · ngăn 1");
    expect(notePositionLabel({ midi: 60, name: "C4", fret: 5, visible: true })).toBe("C4 · ngăn 5");
  });

  it("leaves the fret off when the hand is not visible", () => {
    expect(notePositionLabel({ midi: 60, name: "C4", fret: 1, visible: false })).toBe("C4");
    expect(notePositionLabel({ midi: 60, name: "C4" })).toBe("C4");
  });
});

describe("parseFretRead", () => {
  it("accepts a clear fret and rejects a guess", () => {
    expect(parseFretRead({ fret: 1, visible: true })).toEqual({ fret: 1, visible: true });
    expect(parseFretRead({ fret: 5, visible: false })).toEqual({ visible: false });
    expect(parseFretRead({ fret: 20, visible: true })).toEqual({ visible: false });
    expect(parseFretRead({ string: 2, fret: 1, visible: true })).toEqual({ fret: 1, visible: true });
  });
});
