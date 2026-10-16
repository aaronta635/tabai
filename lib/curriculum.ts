export const DEFAULT_PARTS = [
  { name: "Beginner", vi: "Cơ bản", sortOrder: 0 },
  { name: "Mid", vi: "Trung cấp", sortOrder: 1 },
  { name: "Advanced", vi: "Nâng cao", sortOrder: 2 },
] as const;

/** Starter shelves stay in the teacher's language until they rename them. */
export function shelfName(stored: string, locale: string) {
  const starter = DEFAULT_PARTS.find((part) => part.name === stored);
  if (!starter) return stored;
  return locale === "en" ? starter.name : starter.vi;
}
