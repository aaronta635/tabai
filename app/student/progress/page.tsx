import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { assignmentsWhereForStudent } from "@/lib/lms";
import { activityStreak, heatmapCounts } from "@/lib/practice";
import { milestoneOf, milestoneText } from "@/lib/report";
import { practiceMinutes } from "@/lib/student-view";
import { PracticeHeatmap } from "@/components/student/practice-heatmap";

export default async function StudentProgressPage() {
  const student = await readStudentSession();
  if (!student) redirect(signInPath("student", "/student"));
  const locale = await getLocale();
  const t = await getMessages(locale);
  const [takes, practices, replyCount, assignedCount] = await Promise.all([
    prisma.submission.findMany({
      where: { studentId: student.id },
      select: { submittedAt: true, kind: true },
    }),
    prisma.practiceSession.findMany({
      where: { studentId: student.id },
      select: { startedAt: true, seconds: true },
    }),
    prisma.reply.count({ where: { submission: { studentId: student.id } } }),
    prisma.assignment.count({ where: assignmentsWhereForStudent(student.id) }),
  ]);

  const activity = [...takes.map((row) => row.submittedAt), ...practices.map((row) => row.startedAt)];
  const streak = activityStreak(activity);
  const sent = takes.filter((row) => row.kind !== "practice").length;
  const milestone = milestoneOf({ takes: sent, replies: replyCount, streak });
  const stats = [
    { label: t.student.takesSent, value: sent },
    { label: t.student.repliesGot, value: replyCount },
    { label: t.student.minutesPractised, value: practiceMinutes(practices) },
    { label: t.student.piecesAssigned, value: assignedCount },
  ];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display">{t.student.progressTitle}</h1>
        <p className="page-meta">{t.student.streak.replace("{n}", String(streak))}</p>
        {milestone ? <p className="text-ink-soft">{milestoneText(milestone, t.report)}</p> : null}
      </header>

      <section className="studio-panel">
        <table className="studio-table">
          <tbody>
            {stats.map((stat) => (
              <tr key={stat.label}>
                <td>{stat.label}</td>
                <td className="text-right font-semibold tabular">{stat.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="studio-panel">
        <h2>{t.student.heatmapLong}</h2>
        <PracticeHeatmap days={heatmapCounts(activity, 28)} label={t.student.heatmapLong} />
      </section>
    </div>
  );
}
