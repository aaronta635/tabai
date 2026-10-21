import { customAlphabet } from "nanoid";
import { DEFAULT_PARTS } from "@/lib/curriculum";
import { prisma } from "@/lib/prisma";

export { DEFAULT_PARTS, shelfName } from "@/lib/curriculum";

const classCode = customAlphabet("abcdefghjkmnpqrstuvwxyz", 5);

/** Five letters, skipping i, l, and o so a spoken code stays readable. */
export function newClassCode() {
  return classCode();
}

export function displayClassCode(code: string) {
  return code.toUpperCase();
}

export function classJoinPath(code: string) {
  return `/join/${code}`;
}

/** Optional invite box: one address per line, comma, or space. Invalid lines are skipped. */
export function inviteEmailsFrom(value: string) {
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const part of value.split(/[\s,;]+/)) {
    const email = part.trim().toLowerCase();
    if (!email.includes("@") || email.startsWith("@") || email.endsWith("@") || seen.has(email)) continue;
    seen.add(email);
    emails.push(email);
    if (emails.length === 40) break;
  }
  return emails;
}

// Seeding is a one-time job per teacher, but it used to run on every studio page load.
// Remembering who is already seeded keeps navigation down to the queries a page actually needs.
const seededTeachers = new Set<string>();

export function shouldBackfillOrphanPieces(unassignedCount: number) {
  return unassignedCount > 0;
}

export async function ensureDefaultCurriculum(teacherId: string) {
  if (seededTeachers.has(teacherId)) return;
  let parts = await prisma.curriculumPart.findMany({
    where: { teacherId },
    orderBy: { sortOrder: "asc" },
  });
  if (parts.length === 0) {
    await prisma.curriculumPart.createMany({
      data: DEFAULT_PARTS.map((part) => ({
        teacherId,
        name: part.name,
        sortOrder: part.sortOrder,
      })),
    });
    parts = await prisma.curriculumPart.findMany({
      where: { teacherId },
      orderBy: { sortOrder: "asc" },
    });
  }
  const home = parts[0];
  if (home) {
    const unassigned = await prisma.piece.count({
      where: { teacherId, archived: false, partId: null },
    });
    if (shouldBackfillOrphanPieces(unassigned)) {
      await prisma.piece.updateMany({
        where: { teacherId, archived: false, partId: null },
        data: { partId: home.id },
      });
    }
  }
  seededTeachers.add(teacherId);
}

/** Where a piece lands when the teacher did not pick a part. */
export async function firstCurriculumPartId(teacherId: string) {
  await ensureDefaultCurriculum(teacherId);
  const part = await prisma.curriculumPart.findFirst({
    where: { teacherId },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  return part?.id;
}

export async function assignmentForStudentPiece(input: {
  studentId: string;
  teacherId: string;
  pieceId: string;
}) {
  return prisma.assignment.findFirst({
    where: {
      pieceId: input.pieceId,
      OR: [
        { studentId: input.studentId },
        {
          class: {
            teacherId: input.teacherId,
            memberships: { some: { studentId: input.studentId } },
          },
        },
      ],
    },
    orderBy: { dueAt: "asc" },
  });
}

export async function studentCanAccessPiece(input: {
  studentId: string;
  teacherId: string;
  pieceId: string;
}) {
  const assigned = await assignmentForStudentPiece(input);
  return Boolean(assigned);
}

export function assignmentsWhereForStudent(studentId: string) {
  return {
    pieceId: { not: null },
    OR: [{ studentId }, { class: { memberships: { some: { studentId } } } }],
  };
}

export async function assignmentsForStudent(studentId: string) {
  return prisma.assignment.findMany({
    where: assignmentsWhereForStudent(studentId),
    include: {
      piece: { include: { teacher: { select: { name: true } } } },
      class: { select: { id: true, name: true } },
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
  });
}

export function mailtoInvite(email: string, className: string, code: string) {
  const subject = encodeURIComponent(`Join ${className} on PARA`);
  const body = encodeURIComponent(`Type this class code to join ${className}:\n${displayClassCode(code)}`);
  return `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
}

export async function bindStudentToClass(studentId: string, classCode: string) {
  const code = classCode.trim().toLowerCase();
  if (!code) return { error: "code" as const };
  const studioClass = await prisma.class.findUnique({ where: { code } });
  if (!studioClass || studioClass.archived) return { error: "code" as const };

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "code" as const };
  if (student.teacherId && student.teacherId !== studioClass.teacherId) {
    return { error: "otherClass" as const };
  }

  let membership = await prisma.classMembership.findFirst({
    where: { classId: studioClass.id, studentId: student.id },
  });
  if (!membership && student.email) {
    membership = await prisma.classMembership.findFirst({
      where: {
        classId: studioClass.id,
        invitedEmail: student.email.toLowerCase(),
        studentId: null,
      },
    });
  }

  const approvedAt = student.approvedAt ?? null;
  if (membership) {
    await prisma.classMembership.update({
      where: { id: membership.id },
      data: { studentId: student.id, approvedAt: membership.approvedAt ?? approvedAt },
    });
  } else {
    await prisma.classMembership.create({
      data: {
        classId: studioClass.id,
        studentId: student.id,
        invitedEmail: student.email?.toLowerCase() ?? null,
        approvedAt,
      },
    });
  }

  await prisma.student.update({
    where: { id: student.id },
    data: {
      teacherId: studioClass.teacherId,
      stage: "in_class",
    },
  });

  return { class: studioClass };
}
