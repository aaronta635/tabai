import { alignWithShift, pitchDistance } from "@/lib/align";
import { PITCH_OVERLAY_VERSION } from "@/lib/constants";
import { bestChord, chordsInText, firstChordInText, matchHeardChord, matchWrongRoot, pcFromName, pcName, pitchClass, wrongThird } from "@/lib/chord-tones";
import { notePositionLabel } from "@/lib/fretboard";
import {
  midiFromNote,
  type CompareIssue,
  type CompareObservations,
  type ScoreJson,
  type TutorialCue,
} from "@/lib/score-model";

export type HeardPitchNote = {
  tStart: number;
  tEnd: number | null;
  midi: number;
  name?: string;
  string?: number;
  fret?: number;
  visible?: boolean;
};

export function pitchNotesFromMetrics(metrics: unknown): HeardPitchNote[] {
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) return [];
  const notes = (metrics as { pitch_notes?: unknown }).pitch_notes;
  if (!Array.isArray(notes)) return [];
  return notes.filter((row): row is HeardPitchNote => {
    if (!row || typeof row !== "object") return false;
    const note = row as HeardPitchNote;
    return typeof note.tStart === "number" && typeof note.midi === "number";
  });
}

export function pitchErrorFromMetrics(metrics: unknown): string | null {
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) return null;
  const error = (metrics as { pitch_error?: unknown }).pitch_error;
  return typeof error === "string" && error.trim() ? error : null;
}

/** Re-analyze when the flag is on and this take never wrote this overlay version. */
export function needsPitchOverlay(metrics: unknown) {
  if (process.env.BASIC_PITCH !== "1") return false;
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) return true;
  const row = metrics as {
    pitch_notes?: unknown;
    pitch_error?: unknown;
    pitch_overlay_version?: unknown;
  };
  if (typeof row.pitch_error === "string" && /not installed/i.test(row.pitch_error)) return true;
  if (!Array.isArray(row.pitch_notes)) return true;
  return row.pitch_overlay_version !== PITCH_OVERLAY_VERSION;
}

function duration(note: HeardPitchNote) {
  if (note.tEnd == null || note.tEnd <= note.tStart) return 0.12;
  return note.tEnd - note.tStart;
}

function usableNotes(heard: HeardPitchNote[]) {
  return heard
    .filter((note) => duration(note) >= 0.08 && note.midi >= 40)
    .sort((a, b) => a.tStart - b.tStart);
}

/** Chord strums stack several pitches at once. A lick is one note after another. */
export function isMostlyMelody(notes: HeardPitchNote[]) {
  const usable = usableNotes(notes);
  if (usable.length < 3) return false;
  let stacked = 0;
  for (let i = 0; i < usable.length; i++) {
    const t = usable[i].tStart;
    const pc = pitchClass(usable[i].midi);
    const peer = usable.some(
      (other, j) =>
        j !== i && Math.abs(other.tStart - t) < 0.09 && pitchClass(other.midi) !== pc,
    );
    if (peer) stacked += 1;
  }
  return stacked / usable.length < 0.4;
}

function expectedMelody(score: ScoreJson | null) {
  if (!score) return [];
  return score.sections.flatMap((section) =>
    section.melodyNotes
      .map((name) => ({ name, midi: midiFromNote(name) }))
      .filter((row): row is { name: string; midi: number } => row.midi != null),
  );
}

function sectionChords(score: ScoreJson | null) {
  if (!score) return [];
  return score.sections.flatMap((section) => section.chords);
}

const PRESENCE_WINDOW = 0.5;

type LickMismatch = {
  want: HeardPitchNote;
  got: HeardPitchNote | null;
  targetT: number;
};

type LickCompare = {
  shift: number;
  mismatches: LickMismatch[];
  matchedRatio: number;
};

function shiftIssue(heard: HeardPitchNote[], shift: number): CompareIssue {
  return {
    type: "pitch",
    bar: null,
    tStart: heard[0]?.tStart ?? 0,
    tEnd: null,
    expected: "original pitch",
    observed: `${shift > 0 ? "+" : ""}${shift} semitones`,
    confidence: 0.8,
    verdict: null,
    verdictAt: null,
  };
}

function issuesFromLick(compared: LickCompare, heard: HeardPitchNote[]): CompareIssue[] {
  if (compared.shift !== 0) return [shiftIssue(heard, compared.shift)];
  return compared.mismatches.map(({ want, got, targetT }) => ({
    type: "pitch" as const,
    bar: null,
    tStart: got?.tStart ?? targetT,
    tEnd: got?.tEnd ?? null,
    expected: notePositionLabel(want),
    observed: got ? notePositionLabel(got) : "missing",
    confidence: 0.8,
    verdict: null,
    verdictAt: null,
  }));
}

function gapTime(index: number, heard: HeardPitchNote[], assigned: Map<number, number>) {
  let prev: number | null = null;
  let next: number | null = null;
  for (const [expectedIndex, heardIndex] of assigned) {
    const t = heard[heardIndex]?.tStart;
    if (t == null) continue;
    if (expectedIndex < index && (prev == null || t > prev)) prev = t;
    if (expectedIndex > index && (next == null || t < next)) next = t;
  }
  if (prev != null && next != null) return (prev + next) / 2;
  return prev ?? next ?? heard[0]?.tStart ?? 0;
}

function rankMismatches(rows: LickMismatch[]) {
  return [...rows]
    .sort((a, b) => {
      const byDuration = duration(b.want) - duration(a.want);
      if (Math.abs(byDuration) > 0.05) return byDuration;
      const distance = (row: LickMismatch) => (row.got ? pitchDistance(row.want.midi, row.got.midi) : 6);
      return distance(b) - distance(a);
    })
    .slice(0, 4);
}

/** Align the expected sequence, then flag a note only when its pitch is absent nearby. */
function compareSequence(expected: HeardPitchNote[], heard: HeardPitchNote[]): LickCompare | null {
  if (expected.length < 3 || heard.length === 0) return null;
  const aligned = alignWithShift(expected, heard);
  if (aligned.shift !== 0) return { shift: aligned.shift, mismatches: [], matchedRatio: 1 };
  const assigned = new Map<number, number>();
  for (const step of aligned.steps) {
    if (step.heardIndex == null) continue;
    assigned.set(step.expectedIndex, step.heardIndex);
  }
  const claimed = new Set(assigned.values());
  const mismatches: LickMismatch[] = [];
  let matched = 0;
  for (let i = 0; i < expected.length; i++) {
    const want = expected[i];
    const heardIndex = assigned.get(i);
    const targetT = heardIndex != null ? heard[heardIndex].tStart : gapTime(i, heard, assigned);
    const window = heard.filter((note, index) => {
      if (Math.abs(note.tStart - targetT) > PRESENCE_WINDOW) return false;
      if (claimed.has(index) && index !== heardIndex) return false;
      return true;
    });
    if (window.some((note) => pitchDistance(note.midi, want.midi) <= 1)) {
      matched += 1;
      continue;
    }
    mismatches.push({ want, got: window.length > 0 ? loudest(window) : null, targetT });
  }
  return { shift: 0, mismatches: rankMismatches(mismatches), matchedRatio: matched / expected.length };
}

function melodyCompare(heard: HeardPitchNote[], score: ScoreJson | null): LickCompare | null {
  const expected = expectedMelody(score);
  const notes = usableNotes(heard);
  if (expected.length < 3 || notes.length === 0) return null;
  return compareSequence(
    expected.map((row) => ({ tStart: 0, tEnd: null, midi: row.midi, name: row.name })),
    notes,
  );
}

function tutorialCompare(heard: HeardPitchNote[], tutorial: HeardPitchNote[]): LickCompare | null {
  const expected = usableNotes(tutorial);
  const notes = usableNotes(heard);
  if (expected.length < 3 || !isMostlyMelody(expected) || notes.length === 0) return null;
  return compareSequence(expected, notes);
}

/** Lick notes whose pitch is missing. A constant key shift returns no per-note pairs. */
export function pitchMismatches(heard: HeardPitchNote[], tutorial: HeardPitchNote[]) {
  const compared = tutorialCompare(heard, tutorial);
  if (!compared || compared.shift !== 0) return [];
  return compared.mismatches.flatMap((row) => (row.got ? [{ want: row.want, got: row.got }] : []));
}

function loudest(notes: HeardPitchNote[]) {
  return notes.reduce((a, b) => (duration(b) > duration(a) ? b : a));
}

function expandCueWindows(cues: TutorialCue[]): TutorialCue[] {
  const out: TutorialCue[] = [];
  for (const cue of cues) {
    const fromTopic = chordsInText(cue.topic);
    const chords = fromTopic.length > 0 ? fromTopic : chordsInText(cue.instruction);
    const start = cue.tStart;
    const end = cue.tEnd != null && cue.tEnd > start ? cue.tEnd : start + 2;
    if (chords.length < 2) {
      out.push(chords[0] ? { ...cue, topic: chords[0].symbol } : cue);
      continue;
    }
    const span = end - start;
    for (let i = 0; i < chords.length; i++) {
      out.push({
        ...cue,
        tStart: start + (i / chords.length) * span,
        tEnd: start + ((i + 1) / chords.length) * span,
        topic: chords[i].symbol,
        instruction: chords[i].symbol,
      });
    }
  }
  return out;
}

function noteSpan(notes: HeardPitchNote[]) {
  const usable = usableNotes(notes);
  if (usable.length === 0) return null;
  const start = usable[0].tStart;
  const end = Math.max(...usable.map((note) => note.tEnd ?? note.tStart));
  return { start, end, span: Math.max(end - start, 0.5) };
}

/** Stretch a time on the tutorial clock onto the take clock using heard-note spans. */
export function mapTutorialTime(t: number, tutorial: HeardPitchNote[], student: HeardPitchNote[]) {
  const from = noteSpan(tutorial);
  const to = noteSpan(student);
  if (!from || !to) return t;
  return to.start + ((t - from.start) / from.span) * to.span;
}

function trimCountIn(notes: HeardPitchNote[]) {
  let rest = notes;
  while (rest.length >= 2) {
    const gap = rest[1].tStart - (rest[0].tEnd ?? rest[0].tStart);
    if (gap >= 0.35 && duration(rest[0]) <= 0.3) rest = rest.slice(1);
    else break;
  }
  return rest;
}

function weightsBetween(notes: HeardPitchNote[], start: number, end: number) {
  const inside: HeardPitchNote[] = [];
  const weights = new Map<number, number>();
  for (const note of notes) {
    const noteEnd = note.tEnd ?? note.tStart;
    const overlap = Math.min(noteEnd, end) - Math.max(note.tStart, start);
    if (overlap <= 0) continue;
    inside.push(note);
    const pc = pitchClass(note.midi);
    weights.set(pc, (weights.get(pc) ?? 0) + overlap);
  }
  return { inside, weights };
}

/** Stable chord regions on the take clock. Null when the changes are not clear. */
function detectChordSpans(notes: HeardPitchNote[]) {
  if (notes.length < 4) return null;
  const start = notes[0].tStart;
  const end = Math.max(...notes.map((note) => note.tEnd ?? note.tStart));
  if (end - start < 1.5) return null;
  const win = 0.9;
  const step = 0.2;
  const samples: { t: number; symbol: string | null }[] = [];
  for (let t = start; t < end; t += step) {
    const { weights } = weightsBetween(notes, t, Math.min(end, t + win));
    const chord = bestChord(weights);
    samples.push({ t, symbol: chord ? pcName(chord.root) : null });
  }
  const spans: { tStart: number; tEnd: number }[] = [];
  let current: { symbol: string; tStart: number } | null = null;
  let pendingSymbol = "";
  let pendingStart = 0;
  let pendingCount = 0;
  for (const sample of samples) {
    const symbol = sample.symbol;
    if (!symbol) continue;
    if (current && current.symbol === symbol) {
      pendingCount = 0;
      continue;
    }
    if (pendingCount > 0 && pendingSymbol === symbol) {
      pendingCount += 1;
      if (pendingCount >= 3) {
        if (current) spans.push({ tStart: current.tStart, tEnd: pendingStart });
        current = { symbol: pendingSymbol, tStart: pendingStart };
        pendingCount = 0;
      }
      continue;
    }
    pendingSymbol = symbol;
    pendingStart = sample.t;
    pendingCount = 1;
  }
  if (current) spans.push({ tStart: current.tStart, tEnd: end });
  return spans.length >= 2 ? spans : null;
}

function chordIssues(
  heard: HeardPitchNote[],
  score: ScoreJson | null,
  cues: TutorialCue[],
  tutorialNotes: HeardPitchNote[] = [],
): CompareIssue[] {
  const symbols = sectionChords(score);
  const notes = trimCountIn(usableNotes(heard));
  if (notes.length === 0 || (cues.length === 0 && symbols.length === 0)) return [];

  const t0 = notes[0].tStart;
  const t1 = notes[notes.length - 1].tStart;
  const span = Math.max(t1 - t0, 1);
  const allowBar = (score?.barCount ?? 0) > 0;
  const fromCues = cues.length > 0;
  const mapTime = (t: number) =>
    fromCues && tutorialNotes.length > 0 ? mapTutorialTime(t, tutorialNotes, heard) : t;

  const windows: TutorialCue[] =
    fromCues
      ? expandCueWindows(cues)
      : symbols.map((symbol, index) => ({
          tStart: t0 + (index / Math.max(symbols.length, 1)) * span,
          tEnd: t0 + ((index + 1) / Math.max(symbols.length, 1)) * span,
          topic: symbol,
          instruction: symbol,
          bar: null,
        }));

  const spans = detectChordSpans(notes);
  const useSpans = Boolean(spans && windows.length >= 2 && spans.length === windows.length);
  const limited = windows.slice(0, 8);
  const issues: CompareIssue[] = [];
  for (let i = 0; i < limited.length && issues.length < 4; i++) {
    const cue = limited[i];
    const parsed = firstChordInText(cue.topic) || firstChordInText(cue.instruction);
    if (!parsed) continue;
    const rawStart = cue.tStart;
    const rawEnd = cue.tEnd != null && cue.tEnd > rawStart ? cue.tEnd : (limited[i + 1]?.tStart ?? rawStart + 2);

    if (tutorialNotes.length > 0) {
      const tutorial = weightsBetween(tutorialNotes, rawStart, rawEnd);
      if (tutorial.inside.length > 0 && wrongThird(parsed, tutorial.weights)) continue;
    }

    const start = useSpans && spans ? spans[i].tStart : mapTime(rawStart);
    const end = useSpans && spans ? spans[i].tEnd : mapTime(rawEnd);
    const { inside, weights } = weightsBetween(notes, start, end);
    if (inside.length === 0) continue;
    const heardChord = matchHeardChord(parsed, weights) ?? matchWrongRoot(parsed, weights);
    if (heardChord) {
      const distinct = heardChord.pcs.filter((pc) => !parsed.pcs.includes(pc));
      const offenders = inside.filter((note) => distinct.includes(pitchClass(note.midi)));
      const stamp = loudest(offenders.length > 0 ? offenders : inside);
      issues.push({
        type: "chord",
        bar: allowBar ? cue.bar : null,
        tStart: stamp.tStart,
        tEnd: stamp.tEnd,
        expected: parsed.symbol,
        observed: heardChord.symbol,
        confidence: 0.8,
        verdict: null,
        verdictAt: null,
      });
      continue;
    }
    const third = wrongThird(parsed, weights);
    if (!third) continue;
    const observedPc = pcFromName(third.observed);
    const offenders = observedPc == null ? inside : inside.filter((note) => pitchClass(note.midi) === observedPc);
    const stamp = loudest(offenders.length > 0 ? offenders : inside);
    issues.push({
      type: "pitch",
      bar: allowBar ? cue.bar : null,
      tStart: stamp.tStart,
      tEnd: stamp.tEnd,
      expected: `${parsed.symbol} (${third.expected})`,
      observed: third.observed,
      confidence: 0.8,
      verdict: null,
      verdictAt: null,
    });
  }
  return issues;
}

export type PitchOverlayContext = {
  silenceRatio?: number | null;
  durationS?: number | null;
  pitchError?: string | null;
};

export function judgePitchTake(input: {
  usable: number;
  pitchError?: string | null;
  silenceRatio?: number | null;
  durationS?: number | null;
  matchedRatio?: number | null;
}): "ok" | "weak" {
  if (input.pitchError) return "weak";
  if (input.usable < 3) return "weak";
  const duration = input.durationS ?? 0;
  const silence = input.silenceRatio ?? 0;
  if (duration >= 8 && silence >= 0.85 && input.usable / duration < 0.25) return "weak";
  if (input.matchedRatio != null && input.matchedRatio < 0.2) return "weak";
  return "ok";
}

/**
 * Basic Pitch is the pitch source. Gemini pitch and chord guesses are dropped whenever this overlay runs.
 * A lick bar exists only when the expected pitch is missing from the aligned window.
 * A 1-semitone miss stays quiet. Chord songs can name a different root, and Am versus A7 still needs G.
 */
export function overlayPitchIssues(
  observations: CompareObservations,
  heard: HeardPitchNote[],
  score: ScoreJson | null,
  cues: TutorialCue[] = [],
  tutorialNotes: HeardPitchNote[] = [],
  context: PitchOverlayContext = {},
): CompareObservations {
  const other = observations.issues.filter((issue) => issue.type !== "pitch" && issue.type !== "chord");
  const usable = usableNotes(heard);
  const melody = expectedMelody(score);
  const chords = sectionChords(score);
  let matchedRatio: number | null = null;
  let pitchIssues: CompareIssue[] = [];
  if (usable.length >= 3) {
    if (tutorialNotes.length >= 3 && isMostlyMelody(tutorialNotes)) {
      const compared = tutorialCompare(heard, tutorialNotes);
      if (compared) {
        matchedRatio = compared.matchedRatio;
        pitchIssues = issuesFromLick(compared, usable);
      }
    } else if (melody.length >= 3 && melody.length >= chords.length) {
      const compared = melodyCompare(heard, score);
      if (compared) {
        matchedRatio = compared.matchedRatio;
        pitchIssues = issuesFromLick(compared, usable);
      }
    } else {
      pitchIssues = chordIssues(heard, score, cues, tutorialNotes);
    }
  }
  const pitchJudge = judgePitchTake({
    usable: usable.length,
    pitchError: context.pitchError,
    silenceRatio: context.silenceRatio,
    durationS: context.durationS,
    matchedRatio,
  });
  if (pitchJudge === "weak") {
    return { ...observations, pitchJudge, issues: other };
  }
  return {
    ...observations,
    pitchJudge,
    issues: [...other, ...pitchIssues],
  };
}
