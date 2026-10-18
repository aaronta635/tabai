import { mondayOfWeekUtc } from "@/lib/schedule";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Mon–Fri heights for the practice log. Weekend minutes stay out of the five bars. */
export function weekPractice(sessions: { seconds: number; startedAt: Date }[], now = new Date()) {
  const start = mondayOfWeekUtc(now).getTime();
  const seconds = [0, 0, 0, 0, 0];
  for (const row of sessions) {
    const dayStart = Date.UTC(
      row.startedAt.getUTCFullYear(),
      row.startedAt.getUTCMonth(),
      row.startedAt.getUTCDate(),
    );
    const day = Math.floor((dayStart - start) / DAY_MS);
    if (day >= 0 && day < 5) seconds[day] += row.seconds;
  }
  const peak = Math.max(...seconds);
  return {
    totalMinutes: Math.round(seconds.reduce((sum, value) => sum + value, 0) / 60),
    heights: seconds.map((value) => (peak > 0 && value > 0 ? Math.max(14, Math.round((value / peak) * 100)) : 0)),
  };
}
