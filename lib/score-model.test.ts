import { describe, expect, it } from "vitest";
import {
  closeMatch,
  formatClock,
  formatIssueWhere,
  isThinTrainExtract,
  midiFromNote,
  noteFromMidi,
  observationMarkers,
  parseCompareObservations,
  parseTrainExtract,
} from "@/lib/score-model";

describe("score-model parsers", () => {
  it("fills train extract defaults", () => {
    const extract = parseTrainExtract({ title: "Song" });
    expect(extract.title).toBe("Song");
    expect(extract.timeSignature).toBe("4/4");
    expect(extract.tutorialCues).toEqual([]);
  });

  it("clamps compare observations and maps unknown types", () => {
    const observations = parseCompareObservations({
      overallFit: 1.4,
      confidence: -1,
      issues: [{ type: "nope", bar: 7, tStart: 3, expected: "C", observed: "late", confidence: 0.9 }],
    });
    expect(observations.overallFit).toBe(1);
    expect(observations.confidence).toBe(0);
    expect(observations.issues[0]?.type).toBe("technique");
  });

  it("treats a high-fit take with no hard issues as a close match", () => {
    expect(
      closeMatch({
        overallFit: 0.95,
        confidence: 0.8,
        positives: [],
        issues: [],
        nextPractice: "",
      }),
    ).toBe(true);
  });

  it("formats clocks and issue locations", () => {
    expect(formatClock(75)).toBe("1:15");
    expect(formatIssueWhere({ bar: 7, tStart: 8, tEnd: 12 })).toBe("0:08–0:12 (bar 7)");
  });

  it("builds markers only for confident timed issues", () => {
    const markers = observationMarkers({
      overallFit: 0.5,
      confidence: 0.7,
      positives: [],
      nextPractice: "",
      issues: [
        { type: "timing", bar: 1, tStart: 4, tEnd: null, expected: "", observed: "", confidence: 0.8 },
        { type: "pitch", bar: 2, tStart: 9, tEnd: null, expected: "", observed: "", confidence: 0.2 },
      ],
    });
    expect(markers).toEqual([{ tStart: 4, label: "0:04 timing" }]);
  });

  it("maps C4 to MIDI 60", () => {
    expect(midiFromNote("C4")).toBe(60);
    expect(noteFromMidi(64)).toBe("E4");
  });

  it("treats tutorial-only extracts as thin without cues, but not for missing bars", () => {
    const empty = parseTrainExtract({ title: "Season" });
    expect(isThinTrainExtract(empty, { sheet: false, tutorial: true })).toBe(true);
    expect(isThinTrainExtract(empty, { sheet: true, tutorial: false })).toBe(true);

    const tutorialOnly = parseTrainExtract({
      title: "Season",
      tutorialCues: [
        { tStart: 1, topic: "count-in", instruction: "Count 1 2 3 4 then start" },
        { tStart: 8, topic: "chord", instruction: "Change to Am on beat one" },
        { tStart: 16, topic: "thumb", instruction: "Keep the thumb on the sixth string" },
        { tStart: 24, topic: "ending", instruction: "Hold the last chord for two bars" },
      ],
      techniqueFocus: ["steady thumb"],
      commonMistakes: ["rushing the change"],
    });
    expect(isThinTrainExtract(tutorialOnly, { sheet: false, tutorial: true })).toBe(false);
    expect(isThinTrainExtract(tutorialOnly, { sheet: true, tutorial: true })).toBe(true);
  });
});
