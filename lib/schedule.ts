/** Week grid and datetime-local helpers — sessions are stored and shown in UTC (see lib/when). */

export const SCHEDULE_HOUR_START = 7;
export const SCHEDULE_HOUR_END = 22;
export const DEFAULT_SESSION_MINUTES = 60;

export function mondayOfWeekUtc(anchor: Date) {
  const day = new Date(
    Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate()),
  );
  const weekday = day.getUTCDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  day.setUTCDate(day.getUTCDate() + offset);
  return day;
}

export function addUtcDays(value: Date, days: number) {
  const next = new Date(value.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function weekRangeUtc(anchor: Date) {
  const start = mondayOfWeekUtc(anchor);
  const end = addUtcDays(start, 7);
  return { start, end };
}

export function parseWeekParam(raw: string | undefined) {
  if (!raw) return mondayOfWeekUtc(new Date());
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return mondayOfWeekUtc(new Date());
  const day = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (Number.isNaN(day.getTime())) return mondayOfWeekUtc(new Date());
  return mondayOfWeekUtc(day);
}

export function weekParam(value: Date) {
  const y = value.getUTCFullYear();
  const mo = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

export function toDatetimeLocalValue(value: Date) {
  const y = value.getUTCFullYear();
  const mo = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  const h = String(value.getUTCHours()).padStart(2, "0");
  const mi = String(value.getUTCMinutes()).padStart(2, "0");
  return `${y}-${mo}-${d}T${h}:${mi}`;
}

export function parseDatetimeLocal(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const parsed = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function defaultEndsAt(startsAt: Date) {
  return new Date(startsAt.getTime() + DEFAULT_SESSION_MINUTES * 60 * 1000);
}

export function dayLabels(locale: string) {
  const base = mondayOfWeekUtc(new Date("2024-01-01T12:00:00Z"));
  const fmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    weekday: "short",
    timeZone: "UTC",
  });
  return Array.from({ length: 7 }, (_, i) => fmt.format(addUtcDays(base, i)));
}

export function eventLayout(startsAt: Date, endsAt: Date | null) {
  const startMinutes = startsAt.getUTCHours() * 60 + startsAt.getUTCMinutes();
  const gridStart = SCHEDULE_HOUR_START * 60;
  const gridEnd = SCHEDULE_HOUR_END * 60;
  const end = endsAt ?? defaultEndsAt(startsAt);
  const endMinutes = end.getUTCHours() * 60 + end.getUTCMinutes();
  const top = Math.max(0, startMinutes - gridStart);
  const bottom = Math.min(gridEnd - gridStart, Math.max(top + 30, endMinutes - gridStart));
  const span = gridEnd - gridStart;
  return {
    topPct: (top / span) * 100,
    heightPct: Math.max(4, ((bottom - top) / span) * 100),
  };
}

export function slotStartsAt(weekStart: Date, dayIndex: number, hour: number) {
  const day = addUtcDays(weekStart, dayIndex);
  return new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, 0, 0, 0),
  );
}
