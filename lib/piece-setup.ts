export const SONG_TONICS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;
export const SONG_MODES = ["major", "minor"] as const;

export type SongMode = (typeof SONG_MODES)[number];
export type SetupLocale = "vi" | "en";

/** Low string (dây 6) first, high string (dây 1) last. */
export const TUNINGS = [
  { id: "standard", pitches: ["E", "A", "D", "G", "B", "E"], name: { en: "Standard", vi: "Standard" } },
  { id: "drop-d", pitches: ["D", "A", "D", "G", "B", "E"], name: { en: "Drop D", vi: "Drop D" } },
  { id: "half-down", pitches: ["Eb", "Ab", "Db", "Gb", "Bb", "Eb"], name: { en: "Half step down", vi: "Hạ nửa cung" } },
  { id: "dadgad", pitches: ["D", "A", "D", "G", "A", "D"], name: { en: "DADGAD", vi: "DADGAD" } },
  { id: "open-g", pitches: ["D", "G", "D", "G", "B", "D"], name: { en: "Open G", vi: "Open G" } },
  { id: "open-d", pitches: ["D", "A", "D", "F#", "A", "D"], name: { en: "Open D", vi: "Open D" } },
] as const;

export type TuningId = (typeof TUNINGS)[number]["id"];

const KEY_RE = /^(C#|Eb|F#|Ab|Bb|[A-G]) (major|minor)$/;

export function parseSongKey(value?: string | null) {
  const key = value?.trim() ?? "";
  if (!KEY_RE.test(key)) return null;
  return key;
}

export function parseTuning(value?: string | null) {
  const id = value?.trim() ?? "";
  return TUNINGS.some((row) => row.id === id) ? (id as TuningId) : null;
}

export function songKeyLabel(value: string | null | undefined, locale: SetupLocale) {
  const key = parseSongKey(value);
  if (!key) return null;
  const [tonic, mode] = key.split(" ");
  if (locale === "vi") return `${tonic} ${mode === "major" ? "trưởng" : "thứ"}`;
  return `${tonic} ${mode}`;
}

export function tuningById(value: string | null | undefined) {
  const id = parseTuning(value);
  if (!id) return null;
  return TUNINGS.find((row) => row.id === id) ?? null;
}

export function tuningLabel(value: string | null | undefined, locale: SetupLocale) {
  const row = tuningById(value);
  if (!row) return null;
  return `${row.name[locale]} · ${row.pitches.join(" ")}`;
}

export function pieceSetupLabel(
  piece: { songKey?: string | null; tuning?: string | null },
  locale: SetupLocale,
) {
  return [songKeyLabel(piece.songKey, locale), tuningLabel(piece.tuning, locale)].filter(Boolean).join(" · ");
}
