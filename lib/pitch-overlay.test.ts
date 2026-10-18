import { describe, expect, it } from "vitest";
import { overlayPitchIssues, pitchNotesFromMetrics, needsPitchOverlay, mapTutorialTime } from "@/lib/pitch-overlay";
import { PITCH_OVERLAY_VERSION } from "@/lib/constants";
import type { CompareObservations, ScoreJson } from "@/lib/score-model";

const emptyObs: CompareObservations = {
  overallFit: 0.7,
  confidence: 0.8,
  positives: ["steady intro"],
  nextPractice: "slow",
  issues: [
    {
      type: "pitch",
      bar: 1,
      tStart: 1,
      tEnd: null,
      expected: "C4",
      observed: "guess",
      confidence: 0.9,
    },
    {
      type: "timing",
      bar: null,
      tStart: 2,
      tEnd: null,
      expected: "on 1",
      observed: "late",
      confidence: 0.8,
    },
  ],
};

const melodyScore: ScoreJson = {
  title: "Test",
  key: "C",
  tempoBpm: 80,
  timeSignature: "4/4",
  barCount: 4,
  sections: [{ name: "A", startBar: 1, endBar: 2, chords: [], melodyNotes: ["C4", "E4", "G4"], lyrics: null }],
  techniqueFocus: [],
  commonMistakes: [],
};

const chordScore: ScoreJson = {
  title: "Lan Cuoi",
  key: "C",
  tempoBpm: 70,
  timeSignature: "4/4",
  barCount: 0,
  sections: [
    {
      name: "Intro",
      startBar: 1,
      endBar: 4,
      chords: ["C", "E", "Am", "C7", "F", "Fm", "G"],
      melodyNotes: [],
      lyrics: null,
    },
  ],
  techniqueFocus: [],
  commonMistakes: [],
};

describe("overlayPitchIssues", () => {
  it("drops Gemini pitch and time-aligns melody MIDI", () => {
    const next = overlayPitchIssues(
      emptyObs,
      [
        { tStart: 0.2, tEnd: 0.5, midi: 60, name: "C4" },
        { tStart: 0.8, tEnd: 1.1, midi: 62, name: "D4" },
        { tStart: 1.5, tEnd: 1.9, midi: 67, name: "G4" },
      ],
      melodyScore,
    );
    expect(next.issues.some((issue) => issue.type === "timing")).toBe(true);
    const pitch = next.issues.filter((issue) => issue.type === "pitch");
    expect(pitch).toHaveLength(1);
    expect(pitch[0]?.expected).toBe("E4");
    expect(pitch[0]?.observed).toBe("D4");
    expect(pitch.some((issue) => issue.observed === "guess")).toBe(false);
  });

  it("flags a major third when the model chord is Am", () => {
    const next = overlayPitchIssues(
      emptyObs,
      [
        { tStart: 4.1, tEnd: 4.6, midi: 57, name: "A3" },
        { tStart: 4.2, tEnd: 4.7, midi: 61, name: "C#4" },
        { tStart: 4.3, tEnd: 4.8, midi: 64, name: "E4" },
      ],
      chordScore,
      [{ tStart: 4, tEnd: 7, topic: "Am to C7", instruction: "Play the A minor chord", bar: 2 }],
    );
    const pitch = next.issues.filter((issue) => issue.type === "chord");
    expect(pitch[0]?.expected).toBe("Am");
    expect(pitch[0]?.observed).toBe("A");
    expect(pitch[0]?.tStart).toBeCloseTo(4.2, 2);
    expect(pitch[0]?.bar).toBeNull();
  });

  it("drops Gemini pitch when Basic Pitch ran with no notes", () => {
    const next = overlayPitchIssues(emptyObs, [], chordScore);
    expect(next.issues.some((issue) => issue.type === "pitch")).toBe(false);
    expect(next.issues.some((issue) => issue.type === "timing")).toBe(true);
  });

  it("prefers chord windows when the model has more chords than melody notes", () => {
    const mixed: ScoreJson = {
      ...chordScore,
      sections: [{ ...chordScore.sections[0], melodyNotes: ["C4", "E4", "G4"] }],
    };
    const next = overlayPitchIssues(
      emptyObs,
      [
        { tStart: 4.1, tEnd: 4.6, midi: 57, name: "A3" },
        { tStart: 4.2, tEnd: 4.7, midi: 61, name: "C#4" },
        { tStart: 4.3, tEnd: 4.8, midi: 64, name: "E4" },
      ],
      mixed,
      [{ tStart: 4, tEnd: 7, topic: "Am to C7", instruction: "Play the A minor chord", bar: 2 }],
    );
    const pitch = next.issues.filter((issue) => issue.type === "chord");
    expect(pitch[0]?.expected).toBe("Am");
    expect(pitch[0]?.observed).toBe("A");
  });

  it("does not map a G ending cue onto Fm from the chord list", () => {
    const next = overlayPitchIssues(
      emptyObs,
      [
        { tStart: 11.1, tEnd: 11.6, midi: 55, name: "G3" },
        { tStart: 11.2, tEnd: 11.7, midi: 59, name: "B3" },
        { tStart: 11.3, tEnd: 11.8, midi: 62, name: "D4" },
        { tStart: 11.4, tEnd: 11.9, midi: 69, name: "A4" },
      ],
      chordScore,
      [
        { tStart: 0, tEnd: 2, topic: "C", instruction: "C", bar: null },
        { tStart: 2, tEnd: 4, topic: "E", instruction: "E", bar: null },
        { tStart: 4, tEnd: 7, topic: "Am to C7", instruction: "Am", bar: null },
        { tStart: 7, tEnd: 8, topic: "C7", instruction: "C7", bar: null },
        { tStart: 8, tEnd: 10, topic: "F", instruction: "F", bar: null },
        {
          tStart: 11,
          tEnd: 15,
          topic: "Ending Arpeggio",
          instruction: "Arpeggiate down the G major chord slowly",
          bar: null,
        },
      ],
    );
    expect(next.issues.filter((issue) => issue.expected?.includes("Fm"))).toHaveLength(0);
  });

  it("stamps the C# at 0:05, not a later louder C7 in the same tutorial cue", () => {
    const next = overlayPitchIssues(
      emptyObs,
      [
        { tStart: 5.0, tEnd: 5.4, midi: 57, name: "A3" },
        { tStart: 5.05, tEnd: 5.45, midi: 61, name: "C#4" },
        { tStart: 5.1, tEnd: 5.5, midi: 64, name: "E4" },
        { tStart: 6.8, tEnd: 8.2, midi: 60, name: "C4" },
        { tStart: 6.9, tEnd: 8.1, midi: 64, name: "E4" },
        { tStart: 7.0, tEnd: 8.0, midi: 67, name: "G4" },
      ],
      chordScore,
      [
        {
          tStart: 4,
          tEnd: 7,
          topic: "Am to C7",
          instruction: "Play the A minor chord, then add your pinky to create the C7 passing chord",
          bar: 2,
        },
      ],
    );
    const pitch = next.issues.filter((issue) => issue.type === "chord");
    expect(pitch[0]?.expected).toBe("Am");
    expect(pitch[0]?.observed).toBe("A");
    expect(pitch[0]?.tStart).toBeCloseTo(5.05, 2);
    expect(pitch[0]?.bar).toBeNull();
  });

  it("drops Gemini chord names when Basic Pitch heard notes", () => {
    const withChord: CompareObservations = {
      ...emptyObs,
      issues: [
        ...emptyObs.issues,
        {
          type: "chord",
          bar: null,
          tStart: 2,
          tEnd: 4,
          expected: "E",
          observed: "Dm",
          confidence: 0.85,
        },
      ],
    };
    const next = overlayPitchIssues(
      withChord,
      [
        { tStart: 4.1, tEnd: 4.6, midi: 57, name: "A3" },
        { tStart: 4.2, tEnd: 4.7, midi: 61, name: "C#4" },
        { tStart: 4.3, tEnd: 4.8, midi: 64, name: "E4" },
      ],
      chordScore,
      [{ tStart: 4, tEnd: 7, topic: "Am to C7", instruction: "Play the A minor chord", bar: 2 }],
    );
    expect(next.issues.some((issue) => issue.observed === "Dm")).toBe(false);
    expect(next.issues.some((issue) => issue.type === "chord" && issue.observed === "A")).toBe(true);
  });

  it("skips an Fm window when the tutorial itself played F major", () => {
    const next = overlayPitchIssues(
      emptyObs,
      [
        { tStart: 8.2, tEnd: 8.7, midi: 53, name: "F3" },
        { tStart: 8.3, tEnd: 8.8, midi: 57, name: "A3" },
        { tStart: 8.4, tEnd: 8.9, midi: 60, name: "C4" },
      ],
      chordScore,
      [{ tStart: 8, tEnd: 10, topic: "Fm", instruction: "F minor shape", bar: null }],
      [
        { tStart: 8.2, tEnd: 8.7, midi: 53, name: "F3" },
        { tStart: 8.3, tEnd: 8.8, midi: 57, name: "A3" },
        { tStart: 8.4, tEnd: 8.9, midi: 60, name: "C4" },
      ],
    );
    expect(next.issues.some((issue) => issue.expected?.includes("Fm"))).toBe(false);
  });

  it("maps a tutorial cue onto the take clock", () => {
    const next = overlayPitchIssues(
      emptyObs,
      [
        { tStart: 0, tEnd: 0.3, midi: 60, name: "C4" },
        { tStart: 5.05, tEnd: 5.45, midi: 61, name: "C#4" },
        { tStart: 5.1, tEnd: 5.5, midi: 57, name: "A3" },
        { tStart: 5.15, tEnd: 5.55, midi: 64, name: "E4" },
        { tStart: 10, tEnd: 10.4, midi: 67, name: "G4" },
      ],
      chordScore,
      [{ tStart: 6, tEnd: 8, topic: "Am", instruction: "A minor", bar: null }],
      [
        { tStart: 0, tEnd: 0.4, midi: 60, name: "C4" },
        { tStart: 12, tEnd: 12.4, midi: 67, name: "G4" },
      ],
    );
    const pitch = next.issues.filter((issue) => issue.type === "chord");
    expect(pitch[0]?.observed).toBe("A");
    expect(pitch[0]?.tStart).toBeCloseTo(5.05, 2);
  });

  it("flags take notes that disagree with a sequential tutorial lick", () => {
    const lick: ScoreJson = {
      title: "A minor lick",
      key: "A minor",
      tempoBpm: 90,
      timeSignature: "4/4",
      barCount: 0,
      sections: [
        {
          name: "A",
          startBar: 1,
          endBar: 4,
          chords: ["Am"],
          melodyNotes: [],
          lyrics: null,
        },
      ],
      techniqueFocus: [],
      commonMistakes: [],
    };
    const tutorial = [
      { tStart: 1, tEnd: 1.25, midi: 57, name: "A3" },
      { tStart: 2, tEnd: 2.25, midi: 59, name: "B3" },
      { tStart: 3, tEnd: 3.25, midi: 61, name: "C#4" },
      { tStart: 4, tEnd: 4.25, midi: 62, name: "D4" },
      { tStart: 5, tEnd: 5.25, midi: 65, name: "F4" },
      { tStart: 5.3, tEnd: 5.55, midi: 66, name: "F#4" },
    ];
    const take = [
      { tStart: 1, tEnd: 1.25, midi: 57, name: "A3" },
      { tStart: 2, tEnd: 2.25, midi: 59, name: "B3" },
      { tStart: 3, tEnd: 3.25, midi: 61, name: "C#4" },
      { tStart: 4, tEnd: 4.25, midi: 62, name: "D4" },
      { tStart: 5, tEnd: 5.25, midi: 70, name: "A#4" },
      { tStart: 5.3, tEnd: 5.55, midi: 71, name: "B4" },
    ];
    const next = overlayPitchIssues(
      emptyObs,
      take,
      lick,
      [{ tStart: 0, tEnd: 6, topic: "Melody Line", instruction: "Playing melody on the D string", bar: null }],
      tutorial,
    );
    const pitch = next.issues.filter((issue) => issue.type === "pitch");
    expect(pitch.some((issue) => issue.expected === "F4" && issue.observed === "A#4")).toBe(true);
  });

  it("names A7 only when the flat seventh is in the window", () => {
    const next = overlayPitchIssues(
      emptyObs,
      [
        { tStart: 4.1, tEnd: 4.6, midi: 57, name: "A3" },
        { tStart: 4.2, tEnd: 4.7, midi: 61, name: "C#4" },
        { tStart: 4.3, tEnd: 4.8, midi: 64, name: "E4" },
        { tStart: 4.4, tEnd: 4.9, midi: 67, name: "G4" },
      ],
      chordScore,
      [{ tStart: 4, tEnd: 6, topic: "Am", instruction: "A minor", bar: null }],
    );
    const chord = next.issues.find((issue) => issue.type === "chord");
    expect(chord?.expected).toBe("Am");
    expect(chord?.observed).toBe("A7");
  });

  it("refuses to judge a take with too few notes", () => {
    const next = overlayPitchIssues(
      emptyObs,
      [{ tStart: 4.2, tEnd: 4.7, midi: 61, name: "C#4" }],
      chordScore,
      [{ tStart: 4, tEnd: 6, topic: "Am", instruction: "A minor", bar: null }],
    );
    expect(next.pitchJudge).toBe("weak");
    expect(next.issues.some((issue) => issue.type === "pitch" || issue.type === "chord")).toBe(false);
    expect(next.issues.some((issue) => issue.type === "timing")).toBe(true);
  });

  it("does not flag the same pitch when only the fret differs", () => {
    const lick: ScoreJson = {
      title: "C lick",
      key: "C",
      tempoBpm: 80,
      timeSignature: "4/4",
      barCount: 0,
      sections: [{ name: "A", startBar: 1, endBar: 2, chords: [], melodyNotes: [], lyrics: null }],
      techniqueFocus: [],
      commonMistakes: [],
    };
    const shared = { tEnd: 1.3 };
    const next = overlayPitchIssues(
      emptyObs,
      [
        { tStart: 1, ...shared, midi: 60, name: "C4", fret: 5, visible: true },
        { tStart: 2, tEnd: 2.3, midi: 62, name: "D4", fret: 3, visible: true },
        { tStart: 3, tEnd: 3.3, midi: 64, name: "E4", fret: 5, visible: true },
      ],
      lick,
      [{ tStart: 0, tEnd: 4, topic: "Melody", instruction: "Play the lick", bar: null }],
      [
        { tStart: 1, ...shared, midi: 60, name: "C4", fret: 1, visible: true },
        { tStart: 2, tEnd: 2.3, midi: 62, name: "D4", fret: 3, visible: true },
        { tStart: 3, tEnd: 3.3, midi: 64, name: "E4", fret: 5, visible: true },
      ],
    );
    expect(next.issues.filter((issue) => issue.type === "pitch")).toEqual([]);
  });

  it("adds the fret only on a note whose pitch disagrees", () => {
    const lick: ScoreJson = {
      title: "C lick",
      key: "C",
      tempoBpm: 80,
      timeSignature: "4/4",
      barCount: 0,
      sections: [{ name: "A", startBar: 1, endBar: 2, chords: [], melodyNotes: [], lyrics: null }],
      techniqueFocus: [],
      commonMistakes: [],
    };
    const next = overlayPitchIssues(
      emptyObs,
      [
        { tStart: 1, tEnd: 1.3, midi: 62, name: "D4", fret: 3, visible: true },
        { tStart: 2, tEnd: 2.3, midi: 64, name: "E4" },
        { tStart: 3, tEnd: 3.3, midi: 65, name: "F4" },
      ],
      lick,
      [{ tStart: 0, tEnd: 4, topic: "Melody", instruction: "Play the lick", bar: null }],
      [
        { tStart: 1, tEnd: 1.3, midi: 60, name: "C4", fret: 1, visible: true },
        { tStart: 2, tEnd: 2.3, midi: 64, name: "E4", fret: 5, visible: true },
        { tStart: 3, tEnd: 3.3, midi: 65, name: "F4", fret: 6, visible: true },
      ],
    );
    const moved = next.issues.find((issue) => issue.tStart === 1);
    expect(moved?.expected).toBe("C4 · ngăn 1");
    expect(moved?.observed).toBe("D4 · ngăn 3");
    expect(next.issues.some((issue) => issue.expected?.includes("ngăn") && issue.observed?.includes("ngăn") && issue.tStart !== 1)).toBe(
      false,
    );
  });

  it("does not flag a buzz when the expected pitch is also in the window", () => {
    const lick: ScoreJson = {
      title: "C lick",
      key: "C",
      tempoBpm: 80,
      timeSignature: "4/4",
      barCount: 0,
      sections: [{ name: "A", startBar: 1, endBar: 2, chords: [], melodyNotes: [], lyrics: null }],
      techniqueFocus: [],
      commonMistakes: [],
    };
    const next = overlayPitchIssues(
      emptyObs,
      [
        { tStart: 0.95, tEnd: 1.05, midi: 66, name: "F#4" },
        { tStart: 1.3, tEnd: 1.5, midi: 60, name: "C4" },
        { tStart: 2, tEnd: 2.2, midi: 62, name: "D4" },
        { tStart: 3, tEnd: 3.2, midi: 64, name: "E4" },
      ],
      lick,
      [{ tStart: 0, tEnd: 4, topic: "Melody", instruction: "Play the lick", bar: null }],
      [
        { tStart: 1, tEnd: 1.2, midi: 60, name: "C4" },
        { tStart: 2, tEnd: 2.2, midi: 62, name: "D4" },
        { tStart: 3, tEnd: 3.2, midi: 64, name: "E4" },
      ],
    );
    expect(next.issues.filter((issue) => issue.type === "pitch")).toEqual([]);
  });

  it("leaves a one-semitone miss unmarked", () => {
    const lick: ScoreJson = {
      title: "F lick",
      key: "F",
      tempoBpm: 80,
      timeSignature: "4/4",
      barCount: 0,
      sections: [{ name: "A", startBar: 1, endBar: 2, chords: [], melodyNotes: [], lyrics: null }],
      techniqueFocus: [],
      commonMistakes: [],
    };
    const next = overlayPitchIssues(
      emptyObs,
      [
        { tStart: 1, tEnd: 1.2, midi: 66, name: "F#4" },
        { tStart: 2, tEnd: 2.2, midi: 67, name: "G4" },
        { tStart: 3, tEnd: 3.2, midi: 69, name: "A4" },
      ],
      lick,
      [{ tStart: 0, tEnd: 4, topic: "Melody", instruction: "Play the lick", bar: null }],
      [
        { tStart: 1, tEnd: 1.2, midi: 65, name: "F4" },
        { tStart: 2, tEnd: 2.2, midi: 67, name: "G4" },
        { tStart: 3, tEnd: 3.2, midi: 69, name: "A4" },
      ],
    );
    expect(next.issues.filter((issue) => issue.type === "pitch")).toEqual([]);
  });

  it("flags the skipped note instead of shifting every later note", () => {
    const lick: ScoreJson = {
      title: "C lick",
      key: "C",
      tempoBpm: 80,
      timeSignature: "4/4",
      barCount: 0,
      sections: [{ name: "A", startBar: 1, endBar: 2, chords: [], melodyNotes: [], lyrics: null }],
      techniqueFocus: [],
      commonMistakes: [],
    };
    const next = overlayPitchIssues(
      emptyObs,
      [
        { tStart: 1, tEnd: 1.2, midi: 60, name: "C4" },
        { tStart: 3, tEnd: 3.2, midi: 64, name: "E4" },
        { tStart: 4, tEnd: 4.2, midi: 65, name: "F4" },
      ],
      lick,
      [{ tStart: 0, tEnd: 5, topic: "Melody", instruction: "Play the lick", bar: null }],
      [
        { tStart: 1, tEnd: 1.2, midi: 60, name: "C4" },
        { tStart: 2, tEnd: 2.2, midi: 62, name: "D4" },
        { tStart: 3, tEnd: 3.2, midi: 64, name: "E4" },
        { tStart: 4, tEnd: 4.2, midi: 65, name: "F4" },
      ],
    );
    const pitch = next.issues.filter((issue) => issue.type === "pitch");
    expect(pitch).toEqual([expect.objectContaining({ expected: "D4", observed: "missing" })]);
  });

  it("collapses a constant transposition into one bar", () => {
    const lick: ScoreJson = {
      title: "C lick",
      key: "C",
      tempoBpm: 80,
      timeSignature: "4/4",
      barCount: 0,
      sections: [{ name: "A", startBar: 1, endBar: 2, chords: [], melodyNotes: [], lyrics: null }],
      techniqueFocus: [],
      commonMistakes: [],
    };
    const next = overlayPitchIssues(
      emptyObs,
      [
        { tStart: 1, tEnd: 1.2, midi: 62, name: "D4" },
        { tStart: 2, tEnd: 2.2, midi: 64, name: "E4" },
        { tStart: 3, tEnd: 3.2, midi: 66, name: "F#4" },
        { tStart: 4, tEnd: 4.2, midi: 69, name: "A4" },
      ],
      lick,
      [{ tStart: 0, tEnd: 5, topic: "Melody", instruction: "Play the lick", bar: null }],
      [
        { tStart: 1, tEnd: 1.2, midi: 60, name: "C4" },
        { tStart: 2, tEnd: 2.2, midi: 62, name: "D4" },
        { tStart: 3, tEnd: 3.2, midi: 64, name: "E4" },
        { tStart: 4, tEnd: 4.2, midi: 67, name: "G4" },
      ],
    );
    const pitch = next.issues.filter((issue) => issue.type === "pitch");
    expect(pitch).toEqual([expect.objectContaining({ expected: "original pitch", observed: "+2 semitones" })]);
  });

  it("names G when that chord is played instead of Am", () => {
    const next = overlayPitchIssues(
      emptyObs,
      [
        { tStart: 1, tEnd: 1.8, midi: 55, name: "G3" },
        { tStart: 1.02, tEnd: 1.8, midi: 59, name: "B3" },
        { tStart: 1.04, tEnd: 1.8, midi: 62, name: "D4" },
      ],
      chordScore,
      [{ tStart: 0, tEnd: 3, topic: "Am", instruction: "A minor", bar: null }],
    );
    const chord = next.issues.find((issue) => issue.type === "chord");
    expect(chord?.expected).toBe("Am");
    expect(chord?.observed).toBe("G");
  });

  it("ignores a short count-in before the chord", () => {
    const next = overlayPitchIssues(
      emptyObs,
      [
        { tStart: 0.05, tEnd: 0.25, midi: 67, name: "G4" },
        { tStart: 1.0, tEnd: 1.8, midi: 57, name: "A3" },
        { tStart: 1.02, tEnd: 1.8, midi: 60, name: "C4" },
        { tStart: 1.04, tEnd: 1.8, midi: 64, name: "E4" },
      ],
      chordScore,
      [{ tStart: 0, tEnd: 3, topic: "Am", instruction: "A minor", bar: null }],
    );
    expect(next.issues.filter((issue) => issue.type === "chord" || issue.type === "pitch")).toEqual([]);
  });

  it("does not turn a late chord change into a false Am7", () => {
    const am = [57, 60, 64];
    const g = [55, 59, 62];
    const notes = [
      ...am.map((midi, index) => ({ tStart: 0.4 + index * 0.02, tEnd: 2.8, midi, name: "Am" })),
      ...g.map((midi, index) => ({ tStart: 3 + index * 0.02, tEnd: 9.5, midi, name: "G" })),
    ];
    const next = overlayPitchIssues(
      emptyObs,
      notes,
      chordScore,
      [{ tStart: 0, tEnd: 10, topic: "Am to G", instruction: "Am to G", bar: null }],
    );
    expect(next.issues.filter((issue) => issue.type === "chord")).toEqual([]);
  });
});

describe("mapTutorialTime", () => {
  it("stretches tutorial seconds onto the take span", () => {
    const tutorial = [
      { tStart: 0, tEnd: 0.3, midi: 60, name: "C4" },
      { tStart: 11.7, tEnd: 12, midi: 67, name: "G4" },
    ];
    const student = [
      { tStart: 0, tEnd: 0.3, midi: 60, name: "C4" },
      { tStart: 9.7, tEnd: 10, midi: 67, name: "G4" },
    ];
    expect(mapTutorialTime(6, tutorial, student)).toBeCloseTo(5, 2);
  });
});

describe("pitchNotesFromMetrics", () => {
  it("reads stored Basic Pitch events", () => {
    expect(
      pitchNotesFromMetrics({
        pitch_notes: [{ tStart: 1.2, tEnd: 1.5, midi: 60, name: "C4" }],
      }),
    ).toEqual([{ tStart: 1.2, tEnd: 1.5, midi: 60, name: "C4" }]);
  });

  it("needs overlay until this overlay version is stored when BASIC_PITCH=1", () => {
    const previous = process.env.BASIC_PITCH;
    process.env.BASIC_PITCH = "1";
    try {
      expect(needsPitchOverlay({})).toBe(true);
      expect(needsPitchOverlay({ pitch_notes: [] })).toBe(true);
      expect(needsPitchOverlay({ pitch_notes: [], pitch_overlay_version: "pitch-overlay-v1" })).toBe(true);
      expect(needsPitchOverlay({ pitch_notes: [], pitch_overlay_version: PITCH_OVERLAY_VERSION })).toBe(false);
      expect(needsPitchOverlay({ pitch_notes: [], pitch_error: "basic-pitch not installed" })).toBe(true);
    } finally {
      if (previous == null) delete process.env.BASIC_PITCH;
      else process.env.BASIC_PITCH = previous;
    }
  });
});
