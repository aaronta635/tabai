import { midiFromNote, noteFromMidi } from "@/lib/score-model";

export type NotePosition = {
  name?: string;
  midi: number;
  string?: number;
  fret?: number;
  visible?: boolean;
  /** Set only for a string and fret written on the sheet or tab. */
  fromScore?: boolean;
};

export type LocaleLabel = "vi" | "en";

/** Standard tuning. String 1 is the high E, string 6 is the low E. */
const OPEN_STRINGS = [
  { string: 6, midi: 40 },
  { string: 5, midi: 45 },
  { string: 4, midi: 50 },
  { string: 3, midi: 55 },
  { string: 2, midi: 59 },
  { string: 1, midi: 64 },
] as const;

/** First-position fret when one exists; otherwise the smallest fret on the neck. */
export function positionForMidi(midi: number): { string: number; fret: number } | null {
  const playable = OPEN_STRINGS.map((open) => ({ string: open.string, fret: midi - open.midi })).filter(
    (row) => row.fret >= 0 && row.fret <= 15,
  );
  if (playable.length === 0) return null;
  const first = playable.filter((row) => row.fret <= 4);
  const pool = first.length > 0 ? first : playable;
  return pool.reduce((best, row) => (row.fret < best.fret ? row : best));
}

/** A stored tab position wins only when that string and fret produce this MIDI note. */
export function tabPosition(note: { midi: number; string?: number; fret?: number }) {
  if (note.string == null || note.fret == null) return null;
  if (note.string < 1 || note.string > 6 || note.fret < 0 || note.fret > 15) return null;
  const open = OPEN_STRINGS.find((row) => row.string === note.string);
  if (!open || open.midi + note.fret !== note.midi) return null;
  return { string: note.string, fret: note.fret };
}

/** Note name, open-string or fret, and dây number. A video-frame fret is not used. */
export function notePositionLabel(note: NotePosition, locale: LocaleLabel = "vi") {
  const name = note.name?.trim() || noteFromMidi(note.midi);
  const position = (note.fromScore ? tabPosition(note) : null) ?? positionForMidi(note.midi);
  if (!position) return name;
  const stringName = locale === "en" ? `string ${position.string}` : `dây ${position.string}`;
  if (position.fret === 0) {
    const open = locale === "en" ? "open string" : "Dây buông";
    return `${name} · ${open} · ${stringName}`;
  }
  const fret = locale === "en" ? `fret ${position.fret}` : `ngăn ${position.fret}`;
  return `${name} · ${fret} · ${stringName}`;
}

const FACT_NOTE = /^([A-G](?:#|b)?\d)(?:\s*[·•].*)?$/i;

/** Rewrite a stored pitch fact so the letter uses the string map, including older analyses. */
export function labelFactPosition(text: string, locale: LocaleLabel = "vi") {
  const match = text.trim().match(FACT_NOTE);
  if (!match?.[1]) return text;
  const name = match[1].replace(/^([a-g])/, (letter) => letter.toUpperCase());
  const midi = midiFromNote(name);
  if (midi == null) return text;
  return notePositionLabel({ name, midi }, locale);
}

export function parseFretRead(raw: unknown): { fret?: number; visible: boolean } {
  const data = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const fret = typeof data.fret === "number" && Number.isFinite(data.fret) ? Math.round(data.fret) : null;
  if (data.visible !== true || fret == null || fret < 0 || fret > 15) return { visible: false };
  return { fret, visible: true };
}
