import {
  midiFromNote,
  noteFromMidi,
  type CompareObservations,
  type ScoreJson,
} from "@/lib/score-model";

export type HeardPitchNote = {
  tStart: number;
  tEnd: number | null;
  midi: number;
  name?: string;
};

function expectedMelody(score: ScoreJson | null) {
  if (!score) return [];
  return score.sections.flatMap((section) =>
    section.melodyNotes
      .map((name) => ({ name, midi: midiFromNote(name) }))
      .filter((row): row is { name: string; midi: number } => row.midi != null),
  );
}

/** Replace Gemini pitch issues with Basic Pitch deltas when expected melody exists. */
export function overlayPitchIssues(
  observations: CompareObservations,
  heard: HeardPitchNote[],
  score: ScoreJson | null,
): CompareObservations {
  const expected = expectedMelody(score);
  if (expected.length === 0 || heard.length === 0) return observations;

  const count = Math.min(expected.length, heard.length, 8);
  const pitchIssues = [];
  for (let i = 0; i < count; i++) {
    const want = expected[i];
    const got = heard[i];
    if (Math.abs(got.midi - want.midi) < 2) continue;
    pitchIssues.push({
      type: "pitch" as const,
      bar: null,
      tStart: got.tStart,
      tEnd: got.tEnd,
      expected: want.name,
      observed: got.name || noteFromMidi(got.midi),
      confidence: 0.8,
    });
  }

  const other = observations.issues.filter((issue) => issue.type !== "pitch");
  return {
    ...observations,
    issues: [...other, ...pitchIssues],
  };
}
