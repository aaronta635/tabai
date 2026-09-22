import { redirect } from "next/navigation";
import { readStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { assignmentsForStudent } from "@/lib/lms";
import { activityStreak, heatmapCounts } from "@/lib/practice";
import { practiceMinutes } from "@/lib/student-view";
import { PracticeHeatmap } from "@/components/student/practice-heatmap";

export default async function StudentProgressPage() {
  const student = await readStudentSession();
  if (!student) redirect("/auth?role=student");
  const locale = await getLocale();
  const t = await getMessages(locale);
  const [takes, practices, replyCount, assigned] = await Promise.all([
    prisma.submission.findMany({
      where: { studentId: student.id },
      select: { submittedAt: true, kind: true },
    }),
    prisma.practiceSession.findMany({
      where: { studentId: student.id },
      select: { startedAt: true, seconds: true },
    }),
    prisma.reply.count({ where: { submission: { studentId: student.id } } }),
    assignmentsForStudent(student.id),
  ]);

  const activity = [...takes.map((row) => row.submittedAt), ...practices.map((row) => row.startedAt)];
  const streak = activityStreak(activity);
  const stats = [
    { label: t.student.takesSent, value: takes.filter((row) => row.kind !== "practice").length },
    { label: t.student.repliesGot, value: replyCount },
    { label: t.student.minutesPractised, value: practiceMinutes(practices) },
    { label: t.student.piecesAssigned, value: assigned.filter((row) => row.piece).length },
  ];

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl">{t.student.progressTitle}</h1>

      <p className="text-ink-soft">{t.student.streak.replace("{n}", String(streak))}</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="tile">
            <p className="eyebrow">{stat.label}</p>
            <p className="font-display tabular mt-2 text-3xl">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="tile">
        <PracticeHeatmap days={heatmapCounts(activity, 28)} label={t.student.heatmapLong} />
      </section>
    </div>
  );
}
