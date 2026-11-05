import { overlayPitchIssues, type HeardPitchNote } from "@/lib/pitch-overlay";
import type { CompareIssue, CompareObservations, ScoreJson, TutorialCue } from "@/lib/score-model";

const SAFE_TYPES = new Set<CompareIssue["type"]>([
  "tempo_vs_target",
  "chord_not_ringing",
  "melody_note_missing",
  "wrong_pitch_semitone",
]);

const empty: CompareObservations = {
  overallFit: 0,
  confidence: 0,
  positives: [],
  issues: [],
  nextPractice: "",
};

/** Tempo, chord-ring, and melody facts. Gemini does not write these. */
export function deterministicFacts(input: {
  heard: HeardPitchNote[];
  score: ScoreJson | null;
  cues?: TutorialCue[];
  tutorialNotes?: HeardPitchNote[];
  takeBpm?: number | null;
  allowFasterTempo?: boolean;
}): CompareIssue[] {
  const next = overlayPitchIssues(empty, input.heard, input.score, input.cues ?? [], input.tutorialNotes ?? [], {
    takeBpm: input.takeBpm,
    referenceBpm: input.score?.tempoBpm ?? null,
    allowFasterTempo: input.allowFasterTempo,
  });
  return next.issues.filter((issue) => SAFE_TYPES.has(issue.type));
}
