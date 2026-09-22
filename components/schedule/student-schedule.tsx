"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { StudentSessionPanel } from "@/components/schedule/session-panel";
import { WeekCalendar, type CalendarEvent } from "@/components/schedule/week-calendar";
import { addUtcDays, weekParam } from "@/lib/schedule";
import { formatDay } from "@/lib/when";

type SessionRow = {
  id: string;
  className: string;
  teacherName: string;
  title: string | null;
  startsAt: string;
  endsAt: string | null;
  attendance: string | null;
};

export function StudentSchedule({
  locale,
  weekStartIso,
  sessions,
}: {
  locale: string;
  weekStartIso: string;
  sessions: SessionRow[];
}) {
  const t = useTranslations("student");
  const weekStart = new Date(weekStartIso);
  const prevWeek = weekParam(addUtcDays(weekStart, -7));
  const nextWeek = weekParam(addUtcDays(weekStart, 7));
  const weekEnd = addUtcDays(weekStart, 6);
  const weekLabel = `${formatDay(weekStart, locale)} – ${formatDay(weekEnd, locale)}`;

  const events: CalendarEvent[] = useMemo(
    () =>
      sessions.map((row) => ({
        id: row.id,
        className: row.className,
        teacherName: row.teacherName,
        title: row.title,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
      })),
    [sessions],
  );

  const [active, setActive] = useState<CalendarEvent | null>(null);
  const attendance = useMemo(() => {
    if (!active) return null;
    return sessions.find((row) => row.id === active.id)?.attendance ?? null;
  }, [active, sessions]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/student/schedule?w=${prevWeek}`} className="btn btn-quiet px-3 py-1.5 text-sm">
          ←
        </Link>
        <p className="font-ui tabular text-sm text-ink-soft">{weekLabel}</p>
        <Link href={`/student/schedule?w=${nextWeek}`} className="btn btn-quiet px-3 py-1.5 text-sm">
          →
        </Link>
      </div>
      <p className="text-sm text-ink-soft">{t("scheduleHelp")}</p>
      {events.length === 0 ? (
        <p className="text-sm text-ink-soft">{t("noLessonYet")}</p>
      ) : (
        <WeekCalendar
          locale={locale}
          weekStartIso={weekStartIso}
          events={events}
          onSlotClick={() => {}}
          onEventClick={setActive}
          readOnly
        />
      )}
      <StudentSessionPanel
        open={Boolean(active)}
        onClose={() => setActive(null)}
        event={active}
        attendance={attendance}
        locale={locale}
      />
    </div>
  );
}
