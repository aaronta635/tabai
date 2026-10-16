export const SKILLS = ["rhythm", "chords", "fingerstyle", "reading", "singing"] as const;
export const WEAKNESSES = ["timing", "chords", "notes", "confidence"] as const;
export const TEACHING_SPAN = ["new", "some", "long"] as const;

export type Skill = (typeof SKILLS)[number];
export type Weakness = (typeof WEAKNESSES)[number];
export type TeachingSpan = (typeof TEACHING_SPAN)[number];

export function allowList<T extends string>(raw: FormDataEntryValue[], allowed: readonly T[]) {
  const set = new Set(allowed);
  return raw.map(String).filter((value): value is T => set.has(value as T));
}

export function oneOf<T extends string>(raw: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

export function stringList(value: unknown, allowed: readonly string[]) {
  if (!Array.isArray(value)) return [];
  const set = new Set(allowed);
  return value.filter((item): item is string => typeof item === "string" && set.has(item));
}
