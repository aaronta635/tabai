import { describe, expect, it } from "vitest";
import { alignNotes, alignWithShift } from "@/lib/align";

describe("alignNotes", () => {
  it("keeps later notes in place when one note is skipped", () => {
    const expected = [60, 62, 64, 65].map((midi) => ({ midi }));
    const heard = [60, 64, 65].map((midi) => ({ midi }));
    const aligned = alignNotes(expected, heard);
    const pairs = aligned.steps.filter((step) => step.heardIndex != null);
    expect(pairs.map((step) => [step.expectedIndex, step.heardIndex])).toEqual([
      [0, 0],
      [2, 1],
      [3, 2],
    ]);
    expect(aligned.steps.some((step) => step.expectedIndex === 1 && step.heardIndex == null)).toBe(true);
  });

  it("treats a leading extra note as an insertion", () => {
    const expected = [60, 62, 64].map((midi) => ({ midi }));
    const heard = [66, 60, 62, 64].map((midi) => ({ midi }));
    const aligned = alignNotes(expected, heard);
    expect(aligned.steps.map((step) => step.heardIndex)).toEqual([1, 2, 3]);
  });
});

describe("alignWithShift", () => {
  it("reports a constant transposition instead of pairing every note wrong", () => {
    const expected = [60, 62, 64, 67].map((midi) => ({ midi }));
    const heard = expected.map((note) => ({ midi: note.midi + 2 }));
    const aligned = alignWithShift(expected, heard);
    expect(aligned.shift).toBe(2);
    expect(aligned.steps.every((step) => step.heardIndex === step.expectedIndex)).toBe(true);
  });

  it("keeps the original key when only one note moves", () => {
    const expected = [60, 62, 64, 67].map((midi) => ({ midi }));
    const heard = [60, 62, 66, 67].map((midi) => ({ midi }));
    expect(alignWithShift(expected, heard).shift).toBe(0);
  });
});
