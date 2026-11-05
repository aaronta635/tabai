export const TEMPO_FAST_RATIO = 0.12;

export type TempoLocale = "vi" | "en";

export function tempoNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

/**
 * The piece tempo is the teacher target. A take more than 12% faster can say slow down.
 * A slower take says play faster only when the piece flag is on.
 */
export function tempoCue(
  referenceBpm: number | null,
  takeBpm: number | null,
  locale: TempoLocale = "vi",
  options: { allowFaster?: boolean } = {},
) {
  if (referenceBpm == null || takeBpm == null) return null;
  const ratio = (takeBpm - referenceBpm) / referenceBpm;
  const piece = Math.round(referenceBpm);
  const take = Math.round(takeBpm);
  if (ratio > TEMPO_FAST_RATIO) {
    return locale === "en"
      ? `Tempo: the take is about ${take} bpm and the target is about ${piece} bpm. Tell the student to slow down.`
      : `Tempo: take khoảng ${take} bpm, mục tiêu khoảng ${piece} bpm. Viết "đánh chậm lại".`;
  }
  if (options.allowFaster && ratio < -TEMPO_FAST_RATIO) {
    return locale === "en"
      ? `Tempo: the take is about ${take} bpm and the target is about ${piece} bpm. Tell the student to play faster.`
      : `Tempo: take khoảng ${take} bpm, mục tiêu khoảng ${piece} bpm. Viết "đánh nhanh hơn".`;
  }
  return null;
}
