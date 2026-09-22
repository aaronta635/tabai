"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { saveClassSession } from "@/app/teacher/lms-actions";
import { AttendanceChips } from "@/components/teacher/attendance-chips";
import { defaultEndsAt, toDatetimeLocalValue } from "@/lib/schedule";
import { formatWhen } from "@/lib/when";
import type { CalendarEvent } from "@/components/schedule/week-calendar";

type StudentRow = { id: string; name: string; status: string | null };

type TeacherClass = {
  id: string;
  name: string;
  students: { id: string; name: string }[];
};

type Draft = {
  id?: string;
  classId: string;
  title: string;
  startsAt: string;
  endsAt: string;
};

export function TeacherSessionPanel({
  open,
  onClose,
  classes,
  event,
  draftStartsAt,
  roster,
}: {
  open: boolean;
  onClose: () => void;
  classes: TeacherClass[];
  event: CalendarEvent | null;
  draftStartsAt: string | null;
  roster: StudentRow[];
}) {
  const t = useTranslations("teacher");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    if (!open) {
      setDraft(null);
      return;
    }
    if (event) {
      const start = new Date(event.startsAt);
      const end = event.endsAt ? new Date(event.endsAt) : defaultEndsAt(start);
      setDraft({
        id: event.id,
        classId: event.classId ?? classes[0]?.id ?? "",
        title: event.title ?? "",
        startsAt: toDatetimeLocalValue(start),
        endsAt: toDatetimeLocalValue(end),
      });
      return;
    }
    if (draftStartsAt) {
      const start = new Date(draftStartsAt);
      const end = defaultEndsAt(start);
      setDraft({
        classId: classes[0]?.id ?? "",
        title: "",
        startsAt: toDatetimeLocalValue(start),
        endsAt: toDatetimeLocalValue(end),
      });
    }
  }, [open, event, draftStartsAt, classes]);

  if (!open || !draft) return null;

  const saved = Boolean(draft.id);

  return (
    <div className="schedule-overlay" role="dialog" aria-modal="true">
      <button type="button" className="schedule-overlay-backdrop" aria-label={t("closePanel")} onClick={onClose} />
      <div className="schedule-sheet">
        <header className="schedule-sheet-head">
          <h2 className="font-display text-xl">{saved ? t("editSession") : t("createSession")}</h2>
          <button type="button" className="btn btn-quiet px-3 py-1.5 text-sm" onClick={onClose}>
            {t("closePanel")}
          </button>
        </header>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            await saveClassSession({
              id: draft.id,
              classId: draft.classId,
              title: draft.title,
              startsAt: draft.startsAt,
              endsAt: draft.endsAt,
            });
            setBusy(false);
            onClose();
            router.refresh();
          }}
        >
          <label className="sm:col-span-2">
            <span className="field-label">{t("sessionTitle")}</span>
            <input
              name="title"
              className="field mt-1.5"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder={t("upcoming")}
            />
          </label>
          <label>
            <span className="field-label">{t("classesTitle")}</span>
            <select
              name="classId"
              required
              className="field mt-1.5"
              value={draft.classId}
              onChange={(e) => setDraft({ ...draft, classId: e.target.value })}
            >
              {classes.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">{t("startsAt")}</span>
            <input
              type="datetime-local"
              name="startsAt"
              required
              className="field mt-1.5 tabular"
              value={draft.startsAt}
              onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="field-label">{t("endsAt")}</span>
            <input
              type="datetime-local"
              name="endsAt"
              className="field mt-1.5 tabular"
              value={draft.endsAt}
              onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })}
            />
          </label>
          <button type="submit" disabled={busy || !draft.classId} className="btn sm:col-span-2 sm:justify-self-start">
            {saved ? t("saveSession") : t("createSession")}
          </button>
        </form>
        {saved ? (
          <section className="mt-6 space-y-3 border-t border-ink/10 pt-5">
            <h3 className="font-display text-lg">{t("attendance")}</h3>
            {roster.length === 0 ? (
              <p className="text-sm text-ink-soft">{t("rosterEmpty")}</p>
            ) : (
              <ul className="space-y-2">
                {roster.map((row) => (
                  <li key={row.id} className="piece-row flex flex-wrap items-center justify-between gap-3">
                    <p>{row.name}</p>
                    <AttendanceChips
                      sessionId={draft.id!}
                      studentId={row.id}
                      initial={
                        row.status === "present" ||
                        row.status === "absent" ||
                        row.status === "late" ||
                        row.status === "excused"
                          ? row.status
                          : null
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <p className="mt-4 text-sm text-ink-soft">{t("scheduleHelp")}</p>
        )}
      </div>
    </div>
  );
}

export function StudentSessionPanel({
  open,
  onClose,
  event,
  attendance,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  attendance: string | null;
  locale: string;
}) {
  const t = useTranslations("student");
  const tTeacher = useTranslations("teacher");

  if (!open || !event) return null;

  return (
    <div className="schedule-overlay" role="dialog" aria-modal="true">
      <button type="button" className="schedule-overlay-backdrop" aria-label={t("close")} onClick={onClose} />
      <div className="schedule-sheet">
        <header className="schedule-sheet-head">
          <h2 className="font-display text-xl">{event.title || event.className}</h2>
          <button type="button" className="btn btn-quiet px-3 py-1.5 text-sm" onClick={onClose}>
            {t("close")}
          </button>
        </header>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="field-label">{t("openClass")}</dt>
            <dd className="mt-1">{event.className}</dd>
          </div>
          {event.teacherName ? (
            <div>
              <dt className="field-label">{t("teacherLabel")}</dt>
              <dd className="mt-1">{event.teacherName}</dd>
            </div>
          ) : null}
          <div>
            <dt className="field-label">{tTeacher("startsAt")}</dt>
            <dd className="mt-1 tabular">{formatWhen(new Date(event.startsAt), locale)}</dd>
          </div>
          {event.endsAt ? (
            <div>
              <dt className="field-label">{tTeacher("endsAt")}</dt>
              <dd className="mt-1 tabular">{formatWhen(new Date(event.endsAt), locale)}</dd>
            </div>
          ) : null}
          <div>
            <dt className="field-label">{tTeacher("attendance")}</dt>
            <dd className="mt-1">
              {attendance ? tTeacher(attendance as "present" | "absent" | "late" | "excused") : t("attendancePending")}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
