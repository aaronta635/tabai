import { describe, expect, it } from "vitest";
import { parseChordSymbol, pitchClass, wrongThird, firstChordInText, displayCueTopic, displayCueInstruction, chordsInText, matchHeardChord, matchWrongRoot } from "@/lib/chord-tones";

describe("parseChordSymbol", () => {
  it("parses Am, A7, F, Fm, C7, Gm", () => {
    expect(parseChordSymbol("Am")?.pcs).toEqual([0, 4, 9]);
    expect(parseChordSymbol("A7")?.pcs).toEqual([1, 4, 7, 9]);
    expect(parseChordSymbol("F")?.pcs).toEqual([0, 5, 9]);
    expect(parseChordSymbol("Fm")?.pcs).toEqual([0, 5, 8]);
    expect(parseChordSymbol("C7")?.pcs).toEqual([0, 4, 7, 10]);
    expect(parseChordSymbol("Gm")?.pcs).toEqual([2, 7, 10]);
    expect(parseChordSymbol("Am7")?.pcs).toEqual([0, 4, 7, 9]);
  });
});

describe("firstChordInText", () => {
  it("reads Am from spoken A minor", () => {
    expect(firstChordInText("Play the A minor chord")?.symbol).toBe("Am");
    expect(firstChordInText("Am to C7")?.symbol).toBe("Am");
    expect(firstChordInText("Heard C major chord")?.symbol).toBe("C");
    expect(chordsInText("Am to C7").map((row) => row.symbol)).toEqual(["Am", "C7"]);
  });
});

describe("displayCueTopic", () => {
  it("promotes a chord symbol when Gemini wrote Chord Change / Heard", () => {
    expect(displayCueTopic("Chord Change", "Heard C major chord with fingerstyle arpeggio")).toBe("C");
    expect(displayCueInstruction("Heard G major chord")).toBe("G major chord");
    expect(displayCueTopic("Fingerpicking C Major", "Start with the C major chord")).toBe("Fingerpicking C Major");
  });
});

describe("wrongThird", () => {
  it("flags A7 (C#) against expected Am (C)", () => {
    const am = parseChordSymbol("Am")!;
    const weights = new Map<number, number>([
      [pitchClass(57), 0.4],
      [pitchClass(61), 0.5],
      [pitchClass(64), 0.3],
    ]);
    expect(wrongThird(am, weights)).toEqual({ expected: "C", observed: "C#" });
  });

  it("names A7 when C# and G are both present, and A when G is not", () => {
    const am = parseChordSymbol("Am")!;
    const withSeventh = new Map<number, number>([
      [9, 0.4],
      [1, 0.5],
      [4, 0.3],
      [7, 0.4],
    ]);
    expect(matchHeardChord(am, withSeventh)?.symbol).toBe("A7");
    const triad = new Map<number, number>([
      [9, 0.4],
      [1, 0.5],
      [4, 0.3],
    ]);
    expect(matchHeardChord(am, triad)?.symbol).toBe("A");
    expect(matchHeardChord(am, new Map([[1, 0.5]]))).toBeNull();
    expect(matchHeardChord(am, new Map([[9, 0.4], [0, 0.5], [4, 0.3]]))).toBeNull();
  });

  it("names a different root when that chord fits and stays quiet on a true Am", () => {
    const am = parseChordSymbol("Am")!;
    const g = new Map<number, number>([
      [7, 0.4],
      [11, 0.4],
      [2, 0.4],
    ]);
    expect(matchWrongRoot(am, g)?.symbol).toBe("G");
    const trueAm = new Map<number, number>([
      [9, 0.4],
      [0, 0.4],
      [4, 0.4],
    ]);
    expect(matchWrongRoot(am, trueAm)).toBeNull();
    expect(matchHeardChord(am, trueAm)).toBeNull();
  });
});
