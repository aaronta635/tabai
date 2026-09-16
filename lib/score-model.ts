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
  sheetMediaId: string;
  tutorialMediaId: string;
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
    .filter((issue) => issue.confidence >= 0.6 && issue.tStart != null)
    .slice(0, 6)
    .map((issue) => ({
      tStart: issue.tStart as number,
      label: `${formatClock(issue.tStart as number)} ${issue.type}`,
    }));
}
