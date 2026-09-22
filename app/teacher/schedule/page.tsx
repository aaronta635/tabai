import { redirect } from "next/navigation";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { parseWeekParam, weekParam, weekRangeUtc } from "@/lib/schedule";
import { TeacherSchedule } from "@/components/schedule/teacher-schedule";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string; session?: string }>;
}) {
  const teacher = await readTeacherSession();
  if (!teacher) redirect("/auth?next=/teacher/schedule");
  const { w, session: sessionId } = await searchParams;
  const locale = await getLocale();
  const t = await getMessages(locale);
  let { start, end } = weekRangeUtc(parseWeekParam(w));

  if (sessionId) {
    const focus = await prisma.classSession.findFirst({
      where: { id: sessionId, class: { teacherId: teacher.id } },
      select: { startsAt: true },
    });
    if (focus && (focus.startsAt < start || focus.startsAt >= end)) {
      redirect(`/teacher/schedule?w=${weekParam(focus.startsAt)}&session=${sessionId}`);
    }
  }

  const [classes, sessions] = await Promise.all([
    prisma.class.findMany({
      where: { teacherId: teacher.id, archived: false },
      orderBy: { name: "asc" },
      include: {
        memberships: {
          where: { studentId: { not: null } },
          include: { student: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.classSession.findMany({
      where: {
        class: { teacherId: teacher.id, archived: false },
        startsAt: { gte: start, lt: end },
      },
      include: {
        class: { select: { id: true, name: true } },
        attendances: { select: { studentId: true, status: true } },
      },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const classPayload = classes.map((row) => ({
    id: row.id,
    name: row.name,
    students: row.memberships
      .filter((m) => m.student)
      .map((m) => ({ id: m.student!.id, name: m.student!.name })),
  }));

  const sessionPayload = sessions.map((row) => ({
    id: row.id,
    classId: row.class.id,
    className: row.class.name,
    title: row.title,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    attendances: row.attendances.map((a) => ({ studentId: a.studentId, status: a.status })),
  }));

  return (
    <div className="space-y-7">
      <h1 className="font-display text-3xl">{t.teacher.scheduleTitle}</h1>
      <TeacherSchedule
        locale={locale}
        weekStartIso={start.toISOString()}
        classes={classPayload}
        sessions={sessionPayload}
        initialSessionId={sessionId}
      />
    </div>
  );
}
