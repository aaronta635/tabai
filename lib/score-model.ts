export const ISSUE_TYPES = ["timing", "pitch", "chord", "technique", "missing"] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];

export type ScoreSection = {
  name: string;
  startBar: number;
  endBar: number;
  chords: string[];
  melodyNotes: string[];
  lyrics: string | null;
};

export type ScoreJson = {
  title: string;
  key: string;
  tempoBpm: number | null;
  timeSignature: string;
  barCount: number;
  sections: ScoreSection[];
  techniqueFocus: string[];
  commonMistakes: string[];
};

export type TutorialCue = {
  tStart: number;
  tEnd: number | null;
  topic: string;
  instruction: string;
  bar: number | null;
};

export type TutorialCuesJson = {
  cues: TutorialCue[];
};

export type PieceModelSourceJson = {
  sheetMediaId?: string;
  tutorialMediaId?: string;
  sheetSha256?: string;
  tutorialSha256?: string;
  catalogSlug?: string;
  sheetMime?: string;
  tutorialMime?: string;
};

export type CompareIssue = {
  type: IssueType;
  bar: number | null;
  tStart: number | null;
  tEnd: number | null;
  expected: string;
  observed: string;
  confidence: number;
};

export type CompareObservations = {
  overallFit: number;
  confidence: number;
  positives: string[];
  issues: CompareIssue[];
  nextPractice: string;
};

export type TrainExtract = ScoreJson & {
  tutorialCues: TutorialCue[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asIssueType(value: unknown): IssueType {
  if (typeof value === "string" && ISSUE_TYPES.includes(value as IssueType)) {
    return value as IssueType;
  }
  return "technique";
}

export function parseTrainExtract(raw: unknown): TrainExtract {
  const data = asRecord(raw) ?? {};
  const sectionsRaw = Array.isArray(data.sections) ? data.sections : [];
  const cuesRaw = Array.isArray(data.tutorialCues) ? data.tutorialCues : [];
  return {
    title: asString(data.title, "Untitled"),
    key: asString(data.key, "unknown"),
    tempoBpm: asNumber(data.tempoBpm),
    timeSignature: asString(data.timeSignature, "4/4"),
    barCount: asNumber(data.barCount) ?? 0,
    sections: sectionsRaw.map((item, index) => {
      const section = asRecord(item) ?? {};
      const startBar = asNumber(section.startBar) ?? index + 1;
      return {
        name: asString(section.name, `Section ${index + 1}`),
        startBar,
        endBar: asNumber(section.endBar) ?? startBar,
        chords: asStringArray(section.chords),
        melodyNotes: asStringArray(section.melodyNotes),
        lyrics: typeof section.lyrics === "string" ? section.lyrics : null,
      };
    }),
    techniqueFocus: asStringArray(data.techniqueFocus),
    commonMistakes: asStringArray(data.commonMistakes),
    tutorialCues: cuesRaw.map((item) => {
      const cue = asRecord(item) ?? {};
      return {
        tStart: asNumber(cue.tStart) ?? 0,
        tEnd: asNumber(cue.tEnd),
        topic: asString(cue.topic, "technique"),
        instruction: asString(cue.instruction),
        bar: asNumber(cue.bar),
      };
    }),
  };
}

export function splitTrainExtract(extract: TrainExtract): {
  scoreJson: ScoreJson;
  tutorialCuesJson: TutorialCuesJson;
} {
  const { tutorialCues, ...scoreJson } = extract;
  return { scoreJson, tutorialCuesJson: { cues: tutorialCues } };
}

const NOTE_SEMI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function toMidi(note: string) {
  const match = note.trim().match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return null;
  const letter = match[1].toUpperCase();
  const base = NOTE_SEMI[letter];
  if (base == null) return null;
  let midi = base + (Number(match[3]) + 1) * 12;
  if (match[2] === "#") midi += 1;
  if (match[2] === "b") midi -= 1;
  return midi;
}

export function midiFromNote(note: string) {
  return toMidi(note);
}

const MIDI_LETTER = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function noteFromMidi(midi: number) {
  const rounded = Math.round(midi);
  const octave = Math.floor(rounded / 12) - 1;
  const letter = MIDI_LETTER[((rounded % 12) + 12) % 12];
  return `${letter}${octave}`;
}

export function looksLikeScale(notes: string[]) {
  if (notes.length < 6) return false;
  const midi = notes.map(toMidi);
  if (midi.some((value) => value == null)) return false;
  let steps = 0;
  for (let i = 1; i < midi.length; i++) {
    const delta = (midi[i] as number) - (midi[i - 1] as number);
    if (delta >= 1 && delta <= 2) steps += 1;
  }
  return steps / (midi.length - 1) >= 0.8;
}

export type TrainAssets = {
  sheet: boolean;
  tutorial: boolean;
};

export function isThinTrainExtract(extract: TrainExtract, assets: TrainAssets = { sheet: true, tutorial: true }) {
  if (assets.tutorial) {
    const cues = extract.tutorialCues.filter((cue) => cue.instruction.trim().length > 8);
    if (cues.length < 4) return true;
    if (extract.techniqueFocus.length === 0 && extract.commonMistakes.length === 0) return true;
  }
  if (assets.sheet) {
    if (extract.sections.some((section) => looksLikeScale(section.melodyNotes))) return true;
    const hasScore = extract.sections.some(
      (section) => section.melodyNotes.length > 0 || section.chords.length > 0,
    );
    if (!hasScore) return true;
  }
  return false;
}

export function trainExtractRichness(extract: TrainExtract) {
  const cues = extract.tutorialCues.filter((cue) => cue.instruction.trim().length > 8).length;
  const labels = extract.techniqueFocus.length + extract.commonMistakes.length;
  const melody = extract.sections.reduce((sum, section) => sum + section.melodyNotes.length, 0);
  const scalePenalty = extract.sections.filter((section) => looksLikeScale(section.melodyNotes)).length * 8;
  return cues * 4 + labels * 2 + Math.min(melody, 20) - scalePenalty;
}

export function closeMatch(observations: CompareObservations | null) {
  if (!observations || observations.confidence < 0.45) return false;
  const hardIssues = observations.issues.filter((issue) => issue.confidence >= 0.75);
  return observations.overallFit >= 0.9 && hardIssues.length === 0;
}

export function parseCompareObservations(raw: unknown): CompareObservations {
  const data = asRecord(raw) ?? {};
  const issuesRaw = Array.isArray(data.issues) ? data.issues : [];
  return {
    overallFit: clamp01(asNumber(data.overallFit) ?? 0),
    confidence: clamp01(asNumber(data.confidence) ?? 0),
    positives: asStringArray(data.positives),
    nextPractice: asString(data.nextPractice),
    issues: issuesRaw.map((item) => {
      const issue = asRecord(item) ?? {};
      return {
        type: asIssueType(issue.type),
        bar: asNumber(issue.bar),
        tStart: asNumber(issue.tStart),
        tEnd: asNumber(issue.tEnd),
        expected: asString(issue.expected),
        observed: asString(issue.observed),
        confidence: clamp01(asNumber(issue.confidence) ?? 0),
      };
    }),
  };
}

export function isCompareObservations(value: unknown): value is CompareObservations {
  const data = asRecord(value);
  return Boolean(data && typeof data.confidence === "number" && Array.isArray(data.issues));
}

export function formatClock(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatIssueWhere(issue: Pick<CompareIssue, "bar" | "tStart" | "tEnd">) {
  const clock =
    issue.tStart != null
      ? issue.tEnd != null && issue.tEnd > issue.tStart
        ? `${formatClock(issue.tStart)}–${formatClock(issue.tEnd)}`
        : formatClock(issue.tStart)
      : null;
  const bar = issue.bar != null ? `bar ${issue.bar}` : null;
  if (clock && bar) return `${clock} (${bar})`;
  return clock ?? bar;
}

export type ObservationMarker = {
  tStart: number;
  label: string;
};

export function observationMarkers(value: unknown): ObservationMarker[] {
  if (!isCompareObservations(value) || value.confidence < 0.6) return [];
  return value.issues
    .filter((issue) => issue.confidence >= 0.75 && issue.tStart != null)
    .slice(0, 6)
    .map((issue) => ({
      tStart: issue.tStart as number,
      label: `${formatClock(issue.tStart as number)} ${issue.type}`,
    }));
}
