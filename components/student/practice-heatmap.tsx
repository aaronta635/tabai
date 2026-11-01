import type { CSSProperties } from "react";

export function PracticeHeatmap({
  days,
  label,
  locale = "en",
}: {
  days: { day: string; count: number }[];
  label: string;
  locale?: string;
}) {
  const max = Math.max(1, ...days.map((day) => day.count));
  const date = (day: string) => new Date(`${day}T00:00:00Z`);
  const shortDate = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, i) => days.slice(i * 7, i * 7 + 7));
  const range = days.length
    ? ` · ${shortDate.format(date(days[0].day))} – ${shortDate.format(date(days[days.length - 1].day))}`
    : "";

  return (
    <table className="student-activity">
      <caption><span>{label}</span>{range}</caption>
      <thead>
        <tr>
          {days.slice(0, 7).map((day) => (
            <th key={day.day} scope="col">{weekday.format(date(day.day))}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week, i) => (
          <tr key={i}>
            {week.map((day) => (
              <td
                key={day.day}
                title={`${day.day}: ${day.count}`}
                style={{ "--activity-strength": day.count === 0 ? .04 : .08 + (day.count / max) * .14 } as CSSProperties}
              >
                <time dateTime={day.day}>{shortDate.format(date(day.day))}</time>
                <span className="tabular">{day.count}</span>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
