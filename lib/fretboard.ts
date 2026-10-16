import { noteFromMidi } from "@/lib/score-model";

export type NotePosition = {
  name?: string;
  midi: number;
  fret?: number;
  visible?: boolean;
};

/** Note name, plus fret when that frame showed the neck. String is not labeled. */
export function notePositionLabel(note: NotePosition) {
  const name = note.name?.trim() || noteFromMidi(note.midi);
  if (note.visible !== true) return name;
  const fret = note.fret;
  if (fret == null || fret < 0 || fret > 15) return name;
  return `${name} · ngăn ${fret}`;
}

export function parseFretRead(raw: unknown): { fret?: number; visible: boolean } {
  const data = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const fret = typeof data.fret === "number" && Number.isFinite(data.fret) ? Math.round(data.fret) : null;
  if (data.visible !== true || fret == null || fret < 0 || fret > 15) return { visible: false };
  return { fret, visible: true };
}
