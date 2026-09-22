export function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function lastNDays(n: number, now = new Date()) {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(dayKey(d));
  }
  return days;
}

export function activityStreak(dates: Date[], now = new Date()) {
  const set = new Set(dates.map(dayKey));
  let streak = 0;
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (!set.has(dayKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (set.has(dayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function heatmapCounts(dates: Date[], days = 28, now = new Date()) {
  const keys = lastNDays(days, now);
  const counts = new Map(keys.map((key) => [key, 0]));
  for (const date of dates) {
    const key = dayKey(date);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return keys.map((key) => ({ day: key, count: counts.get(key) ?? 0 }));
}

export function pickAssignedPiece<T extends { dueAt: Date | null; createdAt: Date }>(
  pieces: T[],
  now = new Date(),
) {
  if (pieces.length === 0) return null;
  const upcoming = pieces
    .filter((piece) => piece.dueAt && piece.dueAt.getTime() >= now.getTime())
    .sort((a, b) => (a.dueAt as Date).getTime() - (b.dueAt as Date).getTime());
  if (upcoming[0]) return upcoming[0];
  const dated = pieces
    .filter((piece) => piece.dueAt)
    .sort((a, b) => (b.dueAt as Date).getTime() - (a.dueAt as Date).getTime());
  if (dated[0]) return dated[0];
  return [...pieces].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

export function parseDueAt(value?: string | null) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return new Date(`${match[1]}-${match[2]}-${match[3]}T23:59:59.000Z`);
}

export function formatDueLabel(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function parseSubmissionKind(value: unknown) {
  if (value === "practice" || value === "overdub") return value;
  return "take" as const;
}
