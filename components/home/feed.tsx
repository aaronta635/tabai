import Link from "next/link";
import type { ClassColor } from "@/lib/class-color";

export function ClassChips({
  label,
  chips,
}: {
  label: string;
  chips: { id: string; name: string; href: string; color: ClassColor }[];
}) {
  if (chips.length === 0) return null;
  return (
    <nav className="class-chip-row" aria-label={label}>
      {chips.map((chip) => (
        <Link key={chip.id} href={chip.href} className="class-chip">
          <span className={`class-swatch class-tone-${chip.color}`} aria-hidden />
          {chip.name}
        </Link>
      ))}
    </nav>
  );
}

export function FeedBlock({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count?: number;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <section className="space-y-2">
      <h2 className="font-display flex items-baseline gap-2 text-lg">
        {title}
        {count ? <span className="font-ui tabular text-sm text-ink-soft">{count}</span> : null}
      </h2>
      {items.length === 0 ? <p className="text-sm text-ink-soft">{empty}</p> : <ul className="space-y-1.5">{items}</ul>}
    </section>
  );
}

export function StudioTitle({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="studio-page-head">
      <div className="studio-page-title-row">
        <h1 className="font-display">{title}</h1>
        {action}
      </div>
      {meta ? <p className="studio-page-meta">{meta}</p> : null}
    </header>
  );
}

export function LessonList({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: { href: string; time: string; title: string; meta: string }[];
}) {
  return (
    <section className="studio-panel">
      <h2 className="font-display">{title}</h2>
      {rows.length === 0 ? (
        <p className="mb-4 text-sm text-ink-soft">{empty}</p>
      ) : (
        <ul className="lesson-list">
          {rows.map((row) => (
            <li key={row.href + row.time + row.title}>
              <Link href={row.href}>
                <span className="lesson-list-time tabular">{row.time}</span>
                <span className="min-w-0">
                  <span className="block font-medium">{row.title}</span>
                  {row.meta ? <span className="mt-0.5 block text-xs text-ink-soft">{row.meta}</span> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function LessonCard({
  href,
  time,
  title,
  meta,
  status,
  next = false,
}: {
  href: string;
  time: string;
  title: string;
  meta: string;
  status: string;
  next?: boolean;
}) {
  return (
    <Link href={href} className={`lesson-card ${next ? "lesson-card-next" : ""}`}>
      <p className="lesson-card-time">{time}</p>
      <p className="lesson-card-title">{title}</p>
      {meta ? <p className="lesson-card-meta">{meta}</p> : null}
      <p className="lesson-card-status">{status}</p>
    </Link>
  );
}

export function ReviewTable({
  title,
  empty,
  columns,
  rows,
}: {
  title: string;
  empty: string;
  columns: [string, string, string];
  rows: { href: string; title: string; meta: string; when: string; status: string }[];
}) {
  return (
    <section className="studio-panel">
      <h2 className="font-display">{title}</h2>
      {rows.length === 0 ? (
        <p className="mb-4 text-sm text-ink-soft">{empty}</p>
      ) : (
        <table className="studio-table">
          <thead>
            <tr>
              <th>{columns[0]}</th>
              <th>{columns[1]}</th>
              <th>{columns[2]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.href + row.title + row.when}>
                <td>
                  <Link href={row.href} className="row-hit">
                    <span className="block font-medium">{row.title}</span>
                    {row.meta ? <span className="mt-0.5 block text-xs text-ink-soft">{row.meta}</span> : null}
                  </Link>
                </td>
                <td className="tabular text-ink-soft">{row.when}</td>
                <td>
                  <span className="status-chip">{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function AssignmentList({
  title,
  empty,
  rows,
  track = false,
  historyLabel,
}: {
  title: string;
  empty: string;
  rows: { href: string; title: string; meta: string; status: string; progress?: number; fraction?: string }[];
  track?: boolean;
  historyLabel?: string;
}) {
  return (
    <section className="studio-panel">
      <h2 className="font-display">{title}</h2>
      {rows.length === 0 ? (
        <p className="mb-4 text-sm text-ink-soft">{empty}</p>
      ) : (
        <ul>
          {rows.map((row) => (
            <li key={row.href + row.title + row.status}>
              <Link href={row.href} className="assign-row">
                <span className="min-w-0">
                  <span className="block font-medium">{row.title}</span>
                  {row.meta ? <span className="mt-0.5 block text-xs text-ink-soft">{row.meta}</span> : null}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  {track ? (
                    <span className="meter-row">
                      <span>{historyLabel ? `${historyLabel}: ` : ""}{row.fraction ?? "—"}</span>
                      {!historyLabel ? <span className="meter is-slot" aria-hidden>
                        <span style={{ width: `${Math.round((row.progress ?? 0) * 100)}%` }} />
                      </span> : null}
                    </span>
                  ) : null}
                  <span className="status-chip">{row.status}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function SideNote({
  kicker,
  title,
  meta,
  href,
  children,
}: {
  kicker: string;
  title: string;
  meta?: string;
  href?: string;
  children?: React.ReactNode;
}) {
  const body = (
    <>
      <h2>{kicker}</h2>
      <p className="side-card-title text-ink">{title}</p>
      {meta ? <p>{meta}</p> : null}
      {children}
    </>
  );
  if (!href) return <section className="side-card">{body}</section>;
  return (
    <Link href={href} className="side-card block">
      {body}
    </Link>
  );
}

export function PracticeLog({
  title,
  caption,
  days,
  heights = [],
}: {
  title: string;
  caption: string;
  days: string[];
  heights?: number[];
}) {
  return (
    <section className="side-card">
      <h2>{title}</h2>
      <p>{caption}</p>
      <ul className="practice-week">
        {days.map((day, index) => (
          <li key={day}>
            <span className="meter-tall" aria-hidden>
              <span style={{ height: `${heights[index] ?? 0}%` }} />
            </span>
            {day}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function weekDayLabels(locale: string) {
  const monday = new Date(Date.UTC(2026, 0, 5));
  const format = new Intl.DateTimeFormat(locale === "vi" ? "vi" : "en", {
    weekday: "short",
    timeZone: "UTC",
  });
  return Array.from({ length: 5 }, (_, index) => format.format(new Date(monday.getTime() + index * 86400000)));
}
export function FeedRow({
  href,
  tone,
  title,
  meta,
}: {
  href: string;
  tone: ClassColor | "beat" | "wire" | "rosewood";
  title: string;
  meta: string;
}) {
  return (
    <li>
      <Link href={href} className={`feed-row class-tone-${tone} block`}>
        <span className="block">{title}</span>
        {meta ? <span className="font-ui tabular block text-xs text-ink-soft">{meta}</span> : null}
      </Link>
    </li>
  );
}
