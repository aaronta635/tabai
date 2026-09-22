import { prisma } from "@/lib/prisma";

/** Classes the student belongs to, each with the tutor's name — the studio they answer to. */
export function studentClasses(studentId: string) {
  return prisma.classMembership.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      approvedAt: true,
      class: {
        select: {
          id: true,
          name: true,
          code: true,
          teacher: { select: { name: true } },
          _count: { select: { memberships: true, assignments: true } },
        },
      },
    },
  });
}

export function studentClass(studentId: string, classId: string) {
  return prisma.classMembership.findFirst({
    where: { studentId, classId, class: { archived: false } },
    relationLoadStrategy: "join",
    include: {
      class: {
        include: {
          teacher: { select: { name: true } },
          assignments: {
            include: {
              piece: { select: { id: true, title: true, code: true, description: true, note: true } },
              part: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          sessions: {
            where: { startsAt: { gte: new Date() } },
            orderBy: { startsAt: "asc" },
            take: 5,
            select: { id: true, title: true, startsAt: true },
          },
          _count: { select: { memberships: true } },
        },
      },
    },
  });
}

export function practiceMinutes(sessions: { seconds: number }[]) {
  return Math.round(sessions.reduce((total, row) => total + row.seconds, 0) / 60);
}

export function studentScheduleSessions(studentId: string, from: Date, to: Date) {
  return prisma.classSession.findMany({
    where: {
      startsAt: { gte: from, lt: to },
      class: {
        archived: false,
        memberships: { some: { studentId } },
      },
    },
    include: {
      class: {
        select: {
          name: true,
          teacher: { select: { name: true } },
        },
      },
      attendances: {
        where: { studentId },
        select: { status: true },
      },
    },
    orderBy: { startsAt: "asc" },
  });
}
