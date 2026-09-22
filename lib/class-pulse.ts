import { prisma } from "@/lib/prisma";
import { parseCompareObservations, type CompareIssue } from "@/lib/score-model";

export type ClassPulse = {
  takes: number;
  students: number;
  replied: number;
  headline: string;
  bars: { bar: number; count: number }[];
};

export function topIssueBars(
  rows: { studentId: string; issues: Pick<CompareIssue, "bar" | "confidence">[] }[],
  limit = 3,
) {
  const barStudents = new Map<number, Set<string>>();
  for (const row of rows) {
    const seen = new Set<number>();
    for (const issue of row.issues) {
      if (issue.confidence < 0.7 || issue.bar == null || seen.has(issue.bar)) continue;
      seen.add(issue.bar);
      const set = barStudents.get(issue.bar) ?? new Set<string>();
      set.add(row.studentId);
      barStudents.set(issue.bar, set);
    }
  }
  return [...barStudents.entries()]
    .map(([bar, set]) => ({ bar, count: set.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function classPulseHeadline(input: {
  locale: string;
  takes: number;
  students: number;
  topBar: { bar: number; count: number } | null;
}) {
  const vi = input.locale !== "en";
  if (input.topBar) {
    return vi
      ? `${input.topBar.count}/${input.students} học viên lệch ở ô ${input.topBar.bar} tuần này.`
      : `${input.topBar.count}/${input.students} students late at bar ${input.topBar.bar} this week.`;
  }
  return vi
    ? `${input.takes} take từ ${input.students} học viên tuần này. Chưa thấy ô lệch chung.`
    : `${input.takes} takes from ${input.students} students this week. No shared bar yet.`;
}

export async function classPulseForTeacher(teacherId: string, locale: string): Promise<ClassPulse | null> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 7);
  const rows = await prisma.submission.findMany({
    where: {
      piece: { teacherId, archived: false },
      kind: { in: ["take", "overdub"] },
      submittedAt: { gte: since },
      student: { approvedAt: { not: null } },
    },
    select: {
      studentId: true,
      replies: { select: { id: true }, orderBy: { sentAt: "desc" }, take: 1 },
      analyses: { select: { observationsJson: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (rows.length === 0) return null;

  const students = new Set(rows.map((row) => row.studentId));
  const replied = rows.filter((row) => row.replies[0]).length;
  const bars = topIssueBars(
    rows.map((row) => ({
      studentId: row.studentId,
      issues: parseCompareObservations(row.analyses[0]?.observationsJson).issues,
    })),
  );

  return {
    takes: rows.length,
    students: students.size,
    replied,
    headline: classPulseHeadline({
      locale,
      takes: rows.length,
      students: students.size,
      topBar: bars[0] ?? null,
    }),
    bars,
  };
}
