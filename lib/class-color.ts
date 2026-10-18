/** Stable Howl0 tones. Hashed from the class id so a class keeps one color with no schema change. */
export const CLASS_COLORS = ["beat", "wire", "butter", "rosewood"] as const;

export type ClassColor = (typeof CLASS_COLORS)[number];

export function classColor(id: string): ClassColor {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return CLASS_COLORS[(hash >>> 0) % CLASS_COLORS.length];
}
