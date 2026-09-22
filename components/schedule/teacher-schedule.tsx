"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { TeacherSessionPanel } from "@/components/schedule/session-panel";
import { WeekCalendar, type CalendarEvent } from "@/components/schedule/week-calendar";
import { addUtcDays, weekParam } from "@/lib/schedule";
import { formatDay } from "@/lib/when";

type TeacherClass = {
  id: string;
  name: string;
  students: { id: string; name: string }[];
};

type SessionRow = {
  id: string;
  classId: string;
  className: string;
  title: string | null;
  startsAt: string;
  endsAt: string | null;
  attendances: { studentId: string; status: string }[];
};

export function TeacherSchedule({
  locale,
  weekStartIso,
  classes,
  sessions,
  initialSessionId,
}: {
  locale: string;
  weekStartIso: string;
  classes: TeacherClass[];
  sessions: SessionRow[];
  initialSessionId?: string;
}) {
  const t = useTranslations("teacher");
  const router = useRouter();
  const weekStart = new Date(weekStartIso);
  const prevWeek = weekParam(addUtcDays(weekStart, -7));
  const nextWeek = weekParam(addUtcDays(weekStart, 7));
  const weekEnd = addUtcDays(weekStart, 6);
  const weekLabel = `${formatDay(weekStart, locale)} – ${formatDay(weekEnd, locale)}`;

  const events: CalendarEvent[] = useMemo(
    () =>
      sessions.map((row) => ({
        id: row.id,
        classId: row.classId,
        className: row.className,
        title: row.title,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
      })),
    [sessions],
  );

  const [panelOpen, setPanelOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const [draftStartsAt, setDraftStartsAt] = useState<string | null>(null);

  useEffect(() => {
    if (!initialSessionId) return;
    const found = events.find((e) => e.id === initialSessionId);
    if (found) {
      setActiveEvent(found);
      setPanelOpen(true);
    }
  }, [initialSessionId, events]);

  const roster = useMemo(() => {
    const sessionId = activeEvent?.id;
    if (!sessionId) return [];
    const session = sessions.find((row) => row.id === sessionId);
    const classRow = classes.find((row) => row.id === (activeEvent?.classId ?? session?.classId));
    if (!classRow) return [];
    const byStudent = new Map(session?.attendances.map((row) => [row.studentId, row.status]) ?? []);
    return classRow.students.map((student) => ({
      id: student.id,
      name: student.name,
      status: byStudent.get(student.id) ?? null,
    }));
  }, [activeEvent, classes, sessions]);

  const openCreate = (startsAt: string) => {
    setActiveEvent(null);
    setDraftStartsAt(startsAt);
    setPanelOpen(true);
  };

  const openEvent = (event: CalendarEvent) => {
    setActiveEvent(event);
    setDraftStartsAt(null);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setActiveEvent(null);
    setDraftStartsAt(null);
    if (initialSessionId) router.replace("/teacher/schedule");
  };

  if (classes.length === 0) {
    return <p className="text-ink-soft">{t("classesEmpty")}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/teacher/schedule?w=${prevWeek}`} className="btn btn-quiet px-3 py-1.5 text-sm">
          ←
        </Link>
        <p className="font-ui tabular text-sm text-ink-soft">{weekLabel}</p>
        <Link href={`/teacher/schedule?w=${nextWeek}`} className="btn btn-quiet px-3 py-1.5 text-sm">
          →
        </Link>
        <button
          type="button"
          className="btn btn-quiet px-3 py-1.5 text-sm"
          onClick={() => openCreate(new Date().toISOString())}
        >
          {t("createSession")}
        </button>
      </div>
      <p className="text-sm text-ink-soft">{t("scheduleCalendarHelp")}</p>
      <WeekCalendar
        locale={locale}
        weekStartIso={weekStartIso}
        events={events}
        onSlotClick={openCreate}
        onEventClick={openEvent}
      />
      <TeacherSessionPanel
        open={panelOpen}
        onClose={closePanel}
        classes={classes}
        event={activeEvent}
        draftStartsAt={draftStartsAt}
        roster={roster}
      />
    </div>
  );
}
