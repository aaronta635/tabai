import { prisma } from "@/lib/prisma";
import { activityStreak, pickAssignedPiece } from "@/lib/practice";
import { assignmentsWhereForStudent } from "@/lib/lms";
import { weekRangeUtc } from "@/lib/schedule";
import { milestoneOf, newReportToken, safePaymentUrl, weekLabel, type Milestone } from "@/lib/report";

export async function ensureReportToken(studentId: string) {
  const row = await prisma.student.findUnique({
    where: { id: studentId },
    select: { reportToken: true, name: true },
  });
  if (!row || row.name === "anonymised") return null;
  if (row.reportToken) return row.reportToken;
  try {
    const created = await prisma.student.update({
      where: { id: studentId },
      data: { reportToken: newReportToken() },
      select: { reportToken: true },
    });
    return created.reportToken;
  } catch {
    const again = await prisma.student.findUnique({
      where: { id: studentId },
      select: { reportToken: true },
    });
    return again?.reportToken ?? null;
  }
}

export type WeeklyReport = {
  studentName: string;
  teacherName: string;
  week: string;
  song: string | null;
  takes: number;
  streak: number;
  letter: string | null;
  milestone: Milestone | null;
  paymentUrl: string | null;
};

export async function loadWeeklyReport(token: string, locale: string, now = new Date()): Promise<WeeklyReport | null> {
  const student = await prisma.student.findUnique({
    where: { reportToken: token },
    select: {
      id: true,
      name: true,
      teacher: { select: { name: true, paymentUrl: true } },
    },
  });
  if (!student || student.name === "anonymised" || !student.teacher) return null;

  const { start, end } = weekRangeUtc(now);
  const [weekTakes, letter, assignments, takes, practices, replyCount] = await Promise.all([
    prisma.submission.findMany({
      where: {
        studentId: student.id,
        kind: { not: "practice" },
        submittedAt: { gte: start, lt: end },
      },
      orderBy: { submittedAt: "desc" },
      select: { piece: { select: { title: true } } },
    }),
    prisma.reply.findFirst({
      where: { sentAt: { gte: start, lt: end }, submission: { studentId: student.id } },
      orderBy: { sentAt: "desc" },
      select: { text: true },
    }),
    prisma.assignment.findMany({
      where: assignmentsWhereForStudent(student.id),
      select: { dueAt: true, createdAt: true, piece: { select: { title: true } } },
    }),
    prisma.submission.findMany({
      where: { studentId: student.id },
      select: { submittedAt: true, kind: true },
    }),
    prisma.practiceSession.findMany({
      where: { studentId: student.id },
      select: { startedAt: true },
    }),
    prisma.reply.count({ where: { submission: { studentId: student.id } } }),
  ]);

  const sent = takes.filter((row) => row.kind !== "practice").length;
  const activity = [...takes.map((row) => row.submittedAt), ...practices.map((row) => row.startedAt)];
  const streak = activityStreak(activity, now);
  const assigned = pickAssignedPiece(
    assignments.flatMap((row) => (row.piece ? [{ dueAt: row.dueAt, createdAt: row.createdAt, title: row.piece.title }] : [])),
    now,
  );

  return {
    studentName: student.name,
    teacherName: student.teacher.name,
    week: weekLabel(start, locale),
    song: weekTakes[0]?.piece.title ?? assigned?.title ?? null,
    takes: weekTakes.length,
    streak,
    letter: letter?.text ?? null,
    milestone: milestoneOf({ takes: sent, replies: replyCount, streak }),
    paymentUrl: safePaymentUrl(student.teacher.paymentUrl),
  };
}
