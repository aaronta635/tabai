"use server";

import { revalidatePath } from "next/cache";
import { revalidateTeacherHotPath } from "@/lib/teacher-cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { logEvent } from "@/lib/events";
import { enqueueAnalyzeIfApproved } from "@/lib/jobs";
import { ensureDefaultCurriculum, newClassCode } from "@/lib/lms";
import { parseDueAt } from "@/lib/practice";
import { allowList, oneOf, SKILLS, TEACHING_SPAN, WEAKNESSES } from "@/lib/profile";
import { meetingLink } from "@/lib/meeting";
import { parseDatetimeLocal, sessionOccurrences } from "@/lib/schedule";
import { prisma } from "@/lib/prisma";

async function teacherOrThrow() {
  const teacher = await requireTeacher();
  if (!teacher) throw new Error("unauthorized");
  return teacher;
}

function revalidateLms(teacherId: string) {
  revalidateTeacherHotPath(teacherId);
  revalidatePath("/teacher");
  revalidatePath("/teacher/classes");
  revalidatePath("/teacher/curriculum");
  revalidatePath("/teacher/submissions");
  revalidatePath("/teacher/schedule");
  revalidatePath("/student");
  revalidatePath("/student/schedule");
}

export async function createClass(formData: FormData) {
  const teacher = await teacherOrThrow();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const row = await prisma.class.create({
    data: { teacherId: teacher.id, name, code: newClassCode() },
  });
  await logEvent({
    name: "class.created",
    actorType: "teacher",
    actorId: teacher.id,
    teacherId: teacher.id,
    props: { classId: row.id },
  });
  revalidateLms(teacher.id);
  redirect(`/teacher/classes/${row.id}`);
}

export async function renameClass(formData: FormData) {
  const teacher = await teacherOrThrow();
  const id = String(formData.get("classId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const existing = await prisma.class.findFirst({ where: { id, teacherId: teacher.id } });
  if (!existing) throw new Error("not found");
  await prisma.class.update({ where: { id }, data: { name } });
  revalidateLms(teacher.id);
}

export async function inviteByEmail(formData: FormData) {
  const teacher = await teacherOrThrow();
  const classId = String(formData.get("classId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return;
  const studioClass = await prisma.class.findFirst({ where: { id: classId, teacherId: teacher.id } });
  if (!studioClass) throw new Error("not found");
  const existing = await prisma.classMembership.findFirst({
    where: { classId, invitedEmail: email },
  });
  if (!existing) {
    await prisma.classMembership.create({
      data: { classId, invitedEmail: email },
    });
  }
  revalidateLms(teacher.id);
}

export async function approveMembershipForm(formData: FormData) {
  await approveMembership(String(formData.get("membershipId") ?? ""));
}

export async function approveMembership(membershipId: string) {
  const teacher = await teacherOrThrow();
  const membership = await prisma.classMembership.findFirst({
    where: { id: membershipId, class: { teacherId: teacher.id } },
    include: { student: true },
  });
  if (!membership) throw new Error("not found");
  const approvedAt = new Date();
  await prisma.classMembership.update({
    where: { id: membershipId },
    data: { approvedAt },
  });
  if (membership.studentId) {
    await prisma.student.update({
      where: { id: membership.studentId },
      data: { approvedAt: membership.student?.approvedAt ?? approvedAt, stage: "in_class" },
    });
    const pending = await prisma.submission.findMany({
      where: { studentId: membership.studentId, status: "new" },
      select: { id: true },
    });
    for (const row of pending) {
      await enqueueAnalyzeIfApproved(row.id);
    }
  }
  revalidateLms(teacher.id);
}

export async function createCurriculumPart(name: string) {
  const teacher = await teacherOrThrow();
  await ensureDefaultCurriculum(teacher.id);
  const title = name.trim();
  if (!title) return null;
  const last = await prisma.curriculumPart.findFirst({
    where: { teacherId: teacher.id },
    orderBy: { sortOrder: "desc" },
  });
  const part = await prisma.curriculumPart.create({
    data: { teacherId: teacher.id, name: title, sortOrder: (last?.sortOrder ?? -1) + 1 },
    select: { id: true, name: true },
  });
  return part;
}

export async function renameCurriculumPart(input: { partId: string; name: string }) {
  const teacher = await teacherOrThrow();
  const name = input.name.trim();
  if (!name) return;
  const part = await prisma.curriculumPart.findFirst({ where: { id: input.partId, teacherId: teacher.id } });
  if (!part) throw new Error("not found");
  await prisma.curriculumPart.update({ where: { id: part.id }, data: { name } });
}

export async function placePieceOnShelf(input: { pieceId: string; partId: string }) {
  const teacher = await teacherOrThrow();
  const piece = await prisma.piece.findFirst({
    where: { id: input.pieceId, teacherId: teacher.id, archived: false },
    select: { id: true },
  });
  const part = await prisma.curriculumPart.findFirst({
    where: { id: input.partId, teacherId: teacher.id },
    select: { id: true },
  });
  if (!piece || !part) throw new Error("not found");
  await prisma.piece.update({ where: { id: piece.id }, data: { partId: part.id } });
}

export async function createCurriculumPiece(input: {
  partId: string;
  title: string;
  description?: string;
  tips?: string;
}) {
  const teacher = await teacherOrThrow();
  const title = input.title.trim();
  if (!title) return { error: "title_required" as const };
  const part = await prisma.curriculumPart.findFirst({
    where: { id: input.partId, teacherId: teacher.id },
  });
  if (!part) throw new Error("not found");
  const { newPieceCode } = await import("@/lib/auth");
  const piece = await prisma.piece.create({
    data: {
      teacherId: teacher.id,
      partId: part.id,
      code: newPieceCode(),
      title,
      note: input.description?.trim() || null,
      description: input.description?.trim() || null,
      tips: input.tips?.trim() || null,
    },
  });
  revalidateLms(teacher.id);
  return { id: piece.id, code: piece.code };
}

export async function updateCurriculumPiece(input: {
  pieceId: string;
  title?: string;
  description?: string;
  tips?: string;
  partId?: string;
}) {
  const teacher = await teacherOrThrow();
  const piece = await prisma.piece.findFirst({
    where: { id: input.pieceId, teacherId: teacher.id, archived: false },
  });
  if (!piece) throw new Error("not found");
  if (input.partId) {
    const part = await prisma.curriculumPart.findFirst({
      where: { id: input.partId, teacherId: teacher.id },
    });
    if (!part) throw new Error("not found");
  }
  const title = input.title?.trim();
  if (input.title != null && !title) return { error: "title_required" as const };
  await prisma.piece.update({
    where: { id: piece.id },
    data: {
      ...(title ? { title } : {}),
      ...(input.description != null
        ? { description: input.description.trim() || null, note: input.description.trim() || null }
        : {}),
      ...(input.tips != null ? { tips: input.tips.trim() || null } : {}),
      ...(input.partId ? { partId: input.partId } : {}),
    },
  });
  revalidateLms(teacher.id);
  return { ok: true as const };
}

export async function assignWork(input: {
  pieceId?: string;
  partId?: string;
  classId?: string;
  studentId?: string;
  dueAt?: string | null;
  goal?: string;
}) {
  const teacher = await teacherOrThrow();
  if (!input.classId && !input.studentId) return { error: "target_required" as const };
  if (input.classId) {
    const studioClass = await prisma.class.findFirst({
      where: { id: input.classId, teacherId: teacher.id },
    });
    if (!studioClass) throw new Error("not found");
  }
  if (input.studentId) {
    const student = await prisma.student.findFirst({
      where: { id: input.studentId, teacherId: teacher.id },
    });
    if (!student) throw new Error("not found");
  }
  const dueAt = parseDueAt(input.dueAt);
  const goal = input.goal?.trim() || null;
  const target = input.classId
    ? { classId: input.classId, studentId: null as string | null }
    : { classId: null as string | null, studentId: input.studentId! };

  let pieceIds: string[] = [];
  let partId: string | null = null;
  if (input.partId) {
    const part = await prisma.curriculumPart.findFirst({
      where: { id: input.partId, teacherId: teacher.id },
      include: { pieces: { where: { archived: false }, select: { id: true } } },
    });
    if (!part) throw new Error("not found");
    partId = part.id;
    pieceIds = part.pieces.map((piece) => piece.id);
  } else if (input.pieceId) {
    const piece = await prisma.piece.findFirst({
      where: { id: input.pieceId, teacherId: teacher.id, archived: false },
    });
    if (!piece) throw new Error("not found");
    pieceIds = [piece.id];
  } else {
    return { error: "source_required" as const };
  }

  for (const pieceId of pieceIds) {
    await prisma.assignment.create({
      data: {
        pieceId,
        partId,
        classId: target.classId,
        studentId: target.studentId,
        dueAt,
        goal,
      },
    });
  }
  revalidateLms(teacher.id);
  return { ok: true as const, count: pieceIds.length };
}

export async function moveCurriculumPart(input: { partId: string; dir: "up" | "down" }) {
  const teacher = await teacherOrThrow();
  const dir = input.dir === "up" ? -1 : 1;
  const parts = await prisma.curriculumPart.findMany({
    where: { teacherId: teacher.id },
    orderBy: { sortOrder: "asc" },
  });
  const index = parts.findIndex((part) => part.id === input.partId);
  const swap = index >= 0 ? parts[index + dir] : undefined;
  if (!swap || index < 0) return;
  await prisma.$transaction([
    prisma.curriculumPart.update({ where: { id: input.partId }, data: { sortOrder: swap.sortOrder } }),
    prisma.curriculumPart.update({ where: { id: swap.id }, data: { sortOrder: parts[index].sortOrder } }),
  ]);
}

export async function createClassSession(formData: FormData) {
  const teacher = await teacherOrThrow();
  const classId = String(formData.get("classId") ?? "");
  const title = String(formData.get("title") ?? "").trim() || null;
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const startsAt = parseDatetimeLocal(startsAtRaw) ?? (startsAtRaw ? new Date(startsAtRaw) : null);
  if (!startsAt || Number.isNaN(startsAt.getTime())) return;
  const studioClass = await prisma.class.findFirst({ where: { id: classId, teacherId: teacher.id } });
  if (!studioClass) throw new Error("not found");
  const session = await prisma.classSession.create({
    data: { classId, title, startsAt },
  });
  revalidateLms(teacher.id);
  redirect(`/teacher/schedule/${session.id}`);
}

export async function saveClassSession(input: {
  id?: string;
  classId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  repeatWeeks?: number;
  meetingProvider?: string;
  meetingUrl?: string;
}) {
  const teacher = await teacherOrThrow();
  const classId = input.classId.trim();
  const title = input.title.trim() || null;
  const startsAt = parseDatetimeLocal(input.startsAt);
  const endsAt = parseDatetimeLocal(input.endsAt);
  const meeting = meetingLink(input.meetingProvider, input.meetingUrl);
  if (!startsAt || !classId || meeting === undefined) return { error: "invalid" as const };
  const studioClass = await prisma.class.findFirst({ where: { id: classId, teacherId: teacher.id } });
  if (!studioClass) throw new Error("not found");
  const room = meeting
    ? { meetingProvider: meeting.provider, meetingUrl: meeting.url }
    : { meetingProvider: null, meetingUrl: null };

  if (input.id) {
    const updated = await prisma.classSession.updateMany({
      where: { id: input.id, class: { teacherId: teacher.id } },
      data: { classId, title, startsAt, endsAt, ...room },
    });
    if (updated.count === 0) throw new Error("not found");
  } else {
    const seriesId = (input.repeatWeeks ?? 1) > 1 ? crypto.randomUUID() : null;
    await prisma.classSession.createMany({
      data: sessionOccurrences(startsAt, endsAt, input.repeatWeeks ?? 1).map((when) => ({
        classId,
        title,
        startsAt: when.startsAt,
        endsAt: when.endsAt,
        seriesId,
        ...room,
      })),
    });
  }
  revalidateLms(teacher.id);
  return { ok: true as const };
}

export async function setAttendance(input: {
  sessionId: string;
  studentId: string;
  status: "present" | "absent" | "late" | "excused";
}) {
  const teacher = await teacherOrThrow();
  const session = await prisma.classSession.findFirst({
    where: { id: input.sessionId, class: { teacherId: teacher.id } },
  });
  if (!session) throw new Error("not found");
  await prisma.attendance.upsert({
    where: { sessionId_studentId: { sessionId: input.sessionId, studentId: input.studentId } },
    create: { sessionId: input.sessionId, studentId: input.studentId, status: input.status },
    update: { status: input.status },
  });
}

export async function updateTeacherProfile(formData: FormData) {
  const teacher = await teacherOrThrow();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const current = await prisma.teacher.findUnique({
    where: { id: teacher.id },
    select: { answersJson: true },
  });
  const previous =
    current?.answersJson && typeof current.answersJson === "object" && !Array.isArray(current.answersJson)
      ? current.answersJson
      : {};
  await prisma.teacher.update({
    where: { id: teacher.id },
    data: {
      name,
      answersJson: {
        ...previous,
        teaching: oneOf(String(formData.get("teaching") ?? ""), TEACHING_SPAN, "some"),
        skills: allowList(formData.getAll("skills"), SKILLS),
        weaknesses: allowList(formData.getAll("weaknesses"), WEAKNESSES),
      },
    },
  });
  const { setTeacherCookie } = await import("@/lib/auth");
  await setTeacherCookie(teacher.id, name, true);
  revalidatePath("/teacher");
  revalidatePath("/teacher/profile");
}
