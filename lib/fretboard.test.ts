import { describe, expect, it } from "vitest";
import { labelFactPosition, notePositionLabel, parseFretRead, positionForMidi } from "@/lib/fretboard";

describe("notePositionLabel", () => {
  it("names an open string and the dây number from standard tuning", () => {
    expect(positionForMidi(59)).toEqual({ string: 2, fret: 0 });
    expect(notePositionLabel({ midi: 64, name: "E4" })).toBe("E4 · Dây buông · dây 1");
    expect(notePositionLabel({ midi: 59, name: "B3" })).toBe("B3 · Dây buông · dây 2");
    expect(notePositionLabel({ midi: 60, name: "C4" })).toBe("C4 · ngăn 1 · dây 2");
    expect(notePositionLabel({ midi: 62, name: "D4" })).toBe("D4 · ngăn 3 · dây 2");
  });

  it("ignores a video-frame fret that does not match the string map", () => {
    expect(notePositionLabel({ midi: 62, name: "D4", fret: 2, visible: true })).toBe("D4 · ngăn 3 · dây 2");
  });

  it("uses a stored tab position when the sheet marked that string and fret", () => {
    expect(notePositionLabel({ midi: 62, name: "D4", string: 3, fret: 7, fromScore: true })).toBe("D4 · ngăn 7 · dây 3");
  });

  it("ignores a video fret even when that string and fret make the same note", () => {
    expect(notePositionLabel({ midi: 62, name: "D4", string: 3, fret: 7, visible: true })).toBe("D4 · ngăn 3 · dây 2");
  });

  it("rewrites an older fact that only stored a frame fret", () => {
    expect(labelFactPosition("B3")).toBe("B3 · Dây buông · dây 2");
    expect(labelFactPosition("D4 · ngăn 2")).toBe("D4 · ngăn 3 · dây 2");
    expect(labelFactPosition("missing")).toBe("missing");
  });

  it("names the same places in English", () => {
    expect(notePositionLabel({ midi: 64, name: "E4" }, "en")).toBe("E4 · open string · string 1");
    expect(notePositionLabel({ midi: 60, name: "C4" }, "en")).toBe("C4 · fret 1 · string 2");
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
