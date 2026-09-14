"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { newPieceCode, requireTeacher, signOutTeacher } from "@/lib/auth";
import { classifyReplySource } from "@/lib/edit-distance";
import { logEvent } from "@/lib/events";
import { enqueueAnalyzeIfApproved } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { teacherSubmission } from "@/lib/scope";

async function teacherOrThrow() {
  const teacher = await requireTeacher();
  if (!teacher) throw new Error("unauthorized");
  return teacher;
}

export async function createPiece(formData: FormData) {
  const teacher = await teacherOrThrow();
  const title = String(formData.get("title") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!title) throw new Error("title required");

  const piece = await prisma.piece.create({
    data: {
      teacherId: teacher.id,
      code: newPieceCode(),
      title,
      note: note || null,
    },
  });
  await logEvent({
    name: "piece.created",
    actorType: "teacher",
    actorId: teacher.id,
    teacherId: teacher.id,
    props: { pieceId: piece.id },
  });
  revalidatePath("/teacher/pieces");
  redirect(`/teacher/pieces?created=${piece.code}`);
}

export async function approveStudent(studentId: string) {
  const teacher = await teacherOrThrow();
  const student = await prisma.student.findFirst({
    where: { id: studentId, teacherId: teacher.id },
  });
  if (!student) throw new Error("not found");

  await prisma.student.update({
    where: { id: studentId },
    data: { approvedAt: new Date() },
  });

  const pending = await prisma.submission.findMany({
    where: { studentId, status: "new" },
    select: { id: true },
  });
  for (const row of pending) {
    await enqueueAnalyzeIfApproved(row.id);
  }

  await logEvent({
    name: "student.approved",
    actorType: "teacher",
    actorId: teacher.id,
    teacherId: teacher.id,
    props: { studentId },
  });
  revalidatePath("/teacher/queue");
}

export async function markOpened(submissionId: string) {
  const teacher = await teacherOrThrow();
  const submission = await teacherSubmission(teacher.id, submissionId);
  if (!submission) throw new Error("not found");
  if (!submission.reviewOpenedAt) {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { reviewOpenedAt: new Date() },
    });
  }
}

export async function sendReply(input: {
  submissionId: string;
  text: string;
  pick?: boolean;
}) {
  const teacher = await teacherOrThrow();
  const submission = await teacherSubmission(teacher.id, input.submissionId);
  if (!submission) throw new Error("not found");

  const text = input.text.trim();
  if (!text) throw new Error("empty reply");

  const draft = submission.drafts[0]?.text ?? null;
  const { source, editDistance } = classifyReplySource(draft, text);
  const openedAt = submission.reviewOpenedAt ?? new Date();
  const sentAt = new Date();

  await prisma.reply.create({
    data: {
      submissionId: submission.id,
      teacherId: teacher.id,
      text,
      source,
      editDistance,
      teacherPick: Boolean(input.pick),
      openedAt,
      sentAt,
    },
  });

  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      status: "answered",
      teacherPick: input.pick ? true : submission.teacherPick,
    },
  });

  await logEvent({
    name: "reply.sent",
    actorType: "teacher",
    actorId: teacher.id,
    teacherId: teacher.id,
    props: {
      submissionId: submission.id,
      source,
      editDistance,
      timePerReplyMs: sentAt.getTime() - openedAt.getTime(),
    },
  });
  revalidatePath("/teacher/queue");
}

export async function skipSubmission(submissionId: string, reason: string) {
  const teacher = await teacherOrThrow();
  const submission = await teacherSubmission(teacher.id, submissionId);
  if (!submission) throw new Error("not found");
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: "skipped", skipReason: reason.trim() || "skipped" },
  });
  await logEvent({
    name: "submission.skipped",
    actorType: "teacher",
    actorId: teacher.id,
    teacherId: teacher.id,
    props: { submissionId, reason },
  });
  revalidatePath("/teacher/queue");
}

export async function togglePick(submissionId: string) {
  const teacher = await teacherOrThrow();
  const submission = await teacherSubmission(teacher.id, submissionId);
  if (!submission) throw new Error("not found");
  const next = !submission.teacherPick;
  await prisma.submission.update({
    where: { id: submissionId },
    data: { teacherPick: next },
  });
  // Pick is a flag, not a reply edit. Latest reply may also carry the mark for the spec field.
  if (submission.replies[0]) {
    await prisma.reply.update({
      where: { id: submission.replies[0].id },
      data: { teacherPick: next },
    });
  }
  revalidatePath("/teacher/queue");
}

export async function updateDelivery(formData: FormData) {
  const teacher = await teacherOrThrow();
  const deliveryType = String(formData.get("deliveryType") ?? "") as "zalo" | "messenger" | "";
  const deliveryHandle = String(formData.get("deliveryHandle") ?? "").trim();
  await prisma.teacher.update({
    where: { id: teacher.id },
    data: {
      deliveryType: deliveryType === "zalo" || deliveryType === "messenger" ? deliveryType : null,
      deliveryHandle: deliveryHandle || null,
    },
  });
  revalidatePath("/teacher/settings");
}

export async function logoutTeacher() {
  await signOutTeacher();
  redirect("/");
}

