import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readStudentSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { parseWeekParam, weekRangeUtc } from "@/lib/schedule";
import { studentScheduleSessions } from "@/lib/student-view";
import { StudentSchedule } from "@/components/schedule/student-schedule";

export default async function StudentSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const student = await readStudentSession();
  if (!student) redirect(signInPath("student", "/student"));
  const { w } = await searchParams;
  const locale = await getLocale();
  const t = await getMessages(locale);
  const { start, end } = weekRangeUtc(parseWeekParam(w));

  const rows = await studentScheduleSessions(student.id, start, end);
  const sessions = rows.map((row) => ({
    id: row.id,
    className: row.class.name,
    teacherName: row.class.teacher.name,
    title: row.title,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    meetingProvider: row.meetingProvider,
    meetingUrl: row.meetingUrl,
    attendance: row.attendances[0]?.status ?? null,
  }));

  return (
    <div className="space-y-7">
      <header>
        <h1 className="font-display">{t.student.scheduleTitle}</h1>
        <p className="page-meta">{t.student.countSessions.replace("{n}", String(sessions.length))}</p>
      </header>
      <StudentSchedule locale={locale} weekStartIso={start.toISOString()} sessions={sessions} />
    </div>
  );
}
