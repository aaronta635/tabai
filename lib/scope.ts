import { prisma } from "@/lib/prisma";

/** Every teacher-facing query must go through these helpers so teacherId is never optional. */

export function teacherPieces(teacherId: string) {
  return prisma.piece.findMany({
    where: { teacherId, archived: false },
    orderBy: { createdAt: "desc" },
  });
}

export function teacherPieceByCode(teacherId: string, code: string) {
  return prisma.piece.findFirst({
    where: { teacherId, code },
  });
}

export function teacherStudents(teacherId: string) {
  return prisma.student.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
  });
}

export function teacherSubmission(teacherId: string, submissionId: string) {
  return prisma.submission.findFirst({
    where: { id: submissionId, piece: { teacherId } },
    include: {
      student: true,
      piece: true,
      media: true,
      drafts: { orderBy: { createdAt: "desc" }, take: 1 },
      replies: { orderBy: { createdAt: "desc" }, take: 1 },
      analyses: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export function studentByTokenForTeacher(teacherId: string, token: string) {
  return prisma.student.findFirst({
    where: { teacherId, token },
  });
}
