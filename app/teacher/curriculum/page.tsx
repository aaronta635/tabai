import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { ensureDefaultCurriculum } from "@/lib/lms";
import { formatWhen } from "@/lib/when";
import { StudioTitle } from "@/components/home/feed";
import { CurriculumBoard, type PieceStat } from "@/components/teacher/curriculum-board";
import { ClassDropList } from "@/components/teacher/class-drop-list";

export default async function CurriculumPage() {
  const teacher = await readTeacherSession();
  if (!teacher) redirect(signInPath("tutor", "/teacher"));
  await ensureDefaultCurriculum(teacher.id);
  const locale = await getLocale();
  const t = await getMessages(locale);
  const [parts, classes, students] = await Promise.all([
    prisma.curriculumPart.findMany({
      where: { teacherId: teacher.id },
      orderBy: { sortOrder: "asc" },
      include: {
        pieces: {
          where: { archived: false },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            tips: true,
            sheetMediaId: true,
            tutorialMediaId: true,
            clipMediaId: true,
          },
        },
      },
    }),
    prisma.class.findMany({
      where: { teacherId: teacher.id, archived: false },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    prisma.student.findMany({
      where: { teacherId: teacher.id, name: { not: "anonymised" } },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
  ]);

  const pieceIds = parts.flatMap((part) => part.pieces.map((piece) => piece.id));
  const stats: Record<string, PieceStat> = {};
  if (pieceIds.length > 0) {
    const [counts, dues] = await Promise.all([
      prisma.submission.groupBy({
        by: ["pieceId", "status"],
        where: { pieceId: { in: pieceIds }, kind: { in: ["take", "overdub"] } },
        _count: { _all: true },
      }),
      prisma.assignment.findMany({
        where: { pieceId: { in: pieceIds } },
        orderBy: { dueAt: "asc" },
        select: { pieceId: true, dueAt: true, class: { select: { name: true } } },
      }),
    ]);
    for (const row of counts) {
      const stat = stats[row.pieceId] ?? { reviewed: 0, total: 0, due: null, className: null };
      stat.total += row._count._all;
      if (row.status === "answered") stat.reviewed += row._count._all;
      stats[row.pieceId] = stat;
    }
    for (const row of dues) {
      if (!row.pieceId) continue;
      const stat = stats[row.pieceId] ?? { reviewed: 0, total: 0, due: null, className: null };
      if (!stat.className && row.class?.name) stat.className = row.class.name;
      if (!stat.due && row.dueAt) stat.due = formatWhen(row.dueAt, locale);
      stats[row.pieceId] = stat;
    }
  }
  const pieceCount = pieceIds.length;

  return (
    <div className="space-y-6">
      <StudioTitle
        title={t.teacher.curriculumTitle}
        meta={t.teacher.countPieces.replace("{n}", String(pieceCount))}
      />

      <CurriculumBoard parts={parts} classes={classes} students={students} stats={stats} />

      {classes.length > 0 ? (
        <div className="space-y-2">
          <p className="eyebrow">{t.teacher.dragHint}</p>
          <ClassDropList classes={classes} />
        </div>
      ) : null}
    </div>
  );
}
