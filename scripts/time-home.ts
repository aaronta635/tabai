import { loadLocalEnv } from "../lib/load-env";

loadLocalEnv();

async function main() {
  const { prisma } = await import("../lib/prisma");
  const { loadTeacherNavCounts } = await import("../lib/teacher-stats");
  const { classPulseForTeacher } = await import("../lib/class-pulse");
  const teacher = await prisma.teacher.findFirst({ select: { id: true } });
  if (!teacher) return;
  const now = new Date();
  const started = Date.now();
  await Promise.all([
    loadTeacherNavCounts(teacher.id),
    prisma.class.findMany({ where: { teacherId: teacher.id, archived: false } }),
    prisma.classSession.findMany({
      where: { class: { teacherId: teacher.id, archived: false }, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 4,
      relationLoadStrategy: "join",
      include: { class: { select: { id: true, name: true } } },
    }),
    prisma.submission.findMany({
      where: {
        piece: { teacherId: teacher.id },
        kind: { in: ["take", "overdub"] },
        status: { in: ["new", "drafted"] },
      },
      orderBy: { submittedAt: "asc" },
      take: 5,
      relationLoadStrategy: "join",
      select: { id: true, student: { select: { name: true } }, piece: { select: { title: true } } },
    }),
    prisma.assignment.findMany({
      where: {
        dueAt: { not: null },
        pieceId: { not: null },
        OR: [{ class: { teacherId: teacher.id, archived: false } }, { student: { teacherId: teacher.id } }],
      },
      orderBy: { dueAt: "asc" },
      take: 5,
      relationLoadStrategy: "join",
      select: { id: true, piece: { select: { title: true } }, class: { select: { name: true } } },
    }),
    classPulseForTeacher(teacher.id, "en"),
  ]);
  console.log("home-parallel", Date.now() - started);
  await prisma.$disconnect();
}

main();
