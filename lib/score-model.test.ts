import { describe, expect, it } from "vitest";
import {
  closeMatch,
  chordsFromScore,
  chordSequenceDelta,
  formatClock,
  formatIssueWhere,
  isThinTrainExtract,
  midiFromNote,
  noteFromMidi,
  observationMarkers,
  parseCompareObservations,
  parseTrainExtract,
  heardExtractFromMetrics,
  applyIssueVerdict,
  draftCoversFactVerdicts,
  factVerdictsComplete,
  observationsForDraft,
  whyDraftNotReady,
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
    expect(
      closeMatch({
        overallFit: 0.95,
        confidence: 0.8,
        positives: [],
        issues: [],
        nextPractice: "",
        pitchJudge: "weak",
      }),
    ).toBe(false);
  });

  it("formats clocks and issue locations", () => {
    expect(formatClock(75)).toBe("1:15");
    expect(formatIssueWhere({ bar: 7, tStart: 8, tEnd: 12 })).toBe("0:08–0:12 (bar 7)");
    expect(formatIssueWhere({ bar: null, tStart: 5.05, tEnd: 5.45 })).toBe("0:05");
  });

  it("builds a timestamp bar for every timed issue", () => {
    const markers = observationMarkers({
      overallFit: 0.5,
      confidence: 0.4,
      positives: ["steady intro"],
      nextPractice: "",
      issues: [
        {
          type: "pitch",
          bar: null,
          tStart: 5.05,
          tEnd: 5.45,
          expected: "Am (C)",
          observed: "C#",
          confidence: 0.8,
        },
        { type: "timing", bar: 1, tStart: 4, tEnd: null, expected: "", observed: "", confidence: 0.2 },
        { type: "technique", bar: null, tStart: null, tEnd: null, expected: "thumb", observed: "mute", confidence: 0.9 },
      ],
    });
    expect(markers).toEqual([
      {
        index: 0,
        tStart: 5.05,
        type: "pitch",
        label: "0:05 · Am (C) vs C#",
        expected: "Am (C)",
        observed: "C#",
        verdict: null,
        verdictAt: null,
      },
      {
        index: 1,
        tStart: 4,
        type: "timing",
        label: "0:04 · timing",
        expected: "",
        observed: "",
        verdict: null,
        verdictAt: null,
      },
    ]);
  });

  it("round-trips a teacher verdict on an issue", () => {
    const observations = parseCompareObservations({
      overallFit: 0.5,
      confidence: 0.7,
      issues: [{ type: "pitch", tStart: 5, expected: "Am", observed: "C#", confidence: 0.8 }],
    });
    const marked = applyIssueVerdict(observations, 0, "true", "2026-09-28T00:00:00.000Z");
    expect(marked?.issues[0]?.verdict).toBe("true");
    expect(marked?.issues[0]?.verdictAt).toBe("2026-09-28T00:00:00.000Z");
    expect(applyIssueVerdict(observations, 9, "false")).toBeNull();
  });

  it("holds the letter until every timed fact is marked, then keeps only true issues", () => {
    const open = parseCompareObservations({
      overallFit: 0.5,
      confidence: 0.8,
      positives: ["clean run at 0:01"],
      nextPractice: "fix the slide",
      issues: [
        { type: "technique", tStart: 12, expected: "pressure", observed: "choke", confidence: 0.9 },
        { type: "pitch", tStart: 5, expected: "G#4", observed: "A#4", confidence: 0.9 },
      ],
    });
    expect(factVerdictsComplete(open)).toBe(false);
    expect(observationsForDraft(open)).toBeNull();

    const first = applyIssueVerdict(open, 0, "true", "2026-09-29T01:00:00.000Z");
    expect(factVerdictsComplete(first!)).toBe(false);

    const done = applyIssueVerdict(first!, 1, "false", "2026-09-29T01:00:05.000Z");
    expect(factVerdictsComplete(done!)).toBe(true);
    expect(observationsForDraft(done!)).toEqual({
      ...done,
      issues: [done!.issues[0]],
      nextPractice: "",
    });
    expect(draftCoversFactVerdicts("2026-09-29T01:00:04.000Z", "2026-09-29T01:00:05.000Z", 2)).toBe(false);
    expect(draftCoversFactVerdicts("2026-09-29T01:00:06.000Z", "2026-09-29T01:00:05.000Z", 2)).toBe(true);
    expect(draftCoversFactVerdicts("2026-09-29T01:00:06.000Z", null, 0)).toBe(true);
    expect(
      whyDraftNotReady({
        kind: "take",
        status: "drafted",
        approved: true,
        observations: open,
      }),
    ).toBe("facts_open 2/2");
    expect(
      whyDraftNotReady({
        kind: "take",
        status: "drafted",
        approved: true,
        observations: done,
      }),
    ).toBeNull();
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

  it("lists unique chords from score sections", () => {
    expect(
      chordsFromScore({
        title: "Lan Cuoi",
        key: "C",
        tempoBpm: 70,
        timeSignature: "4/4",
        barCount: 0,
        sections: [{ name: "Intro", startBar: 1, endBar: 4, chords: ["C", "E", "Am", "F", "Fm"], melodyNotes: [], lyrics: null }],
        techniqueFocus: [],
        commonMistakes: [],
      }),
    ).toEqual(["C", "E", "Am", "F", "Fm"]);
  });

  it("diffs chord lists without dropping shared symbols", () => {
    expect(chordSequenceDelta(["C", "E", "Am", "C7", "F", "Fm", "G"], ["C", "E", "A7", "C7", "F", "G"])).toEqual({
      onlyExpected: ["Am", "Fm"],
      onlyHeard: ["A7"],
    });
  });

  it("reads a take extract off metrics", () => {
    expect(heardExtractFromMetrics({ silence_ratio: 0.2 })).toBeNull();
    expect(heardExtractFromMetrics({ heard_extract: { title: "Lan Cuoi", chords: ["A7"] } })).toEqual({
      title: "Lan Cuoi",
      chords: ["A7"],
    });
  });
});
