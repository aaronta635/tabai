"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { newPieceCode, requireTeacher, signOutTeacher } from "@/lib/auth";
import { classifyReplySource } from "@/lib/edit-distance";
import { logEvent } from "@/lib/events";
import { maybeUnlockAiDirect } from "@/lib/growth";
import { enqueueAnalyzeIfApproved } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { CLAIMABLE_SUBMISSION_STATUSES, guardReply, pieceTitleResult } from "@/lib/forms";
import { parseDueAt } from "@/lib/practice";
import { enqueueTrainPiece, linkPieceAssets } from "@/lib/catalog";
import { teacherSubmission } from "@/lib/scope";

async function teacherOrThrow() {
  const teacher = await requireTeacher();
  if (!teacher) throw new Error("unauthorized");
  return teacher;
}

export async function createPiece(formData: FormData) {
  const piece = await createPieceRecord({
    title: String(formData.get("title") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  if ("error" in piece) return;
  redirect(`/teacher/curriculum`);
}

export async function createPieceRecord(input: {
  title: string;
  note: string;
  partId?: string;
  description?: string;
  tips?: string;
}) {
  const teacher = await teacherOrThrow();
  const titled = pieceTitleResult(input.title);
  if ("error" in titled) return { error: "title_required" as const };
  const title = titled.title;
  const note = (input.description ?? input.note).trim();
  const tips = input.tips?.trim() || null;
  let partId = input.partId;
  if (!partId) {
    const { firstCurriculumPartId } = await import("@/lib/lms");
    partId = await firstCurriculumPartId(teacher.id);
  }

  const piece = await prisma.piece.create({
    data: {
      teacherId: teacher.id,
      code: newPieceCode(),
      title,
      note: note || null,
      description: note || null,
      tips,
      partId,
    },
  });
  await logEvent({
    name: "piece.created",
    actorType: "teacher",
    actorId: teacher.id,
    teacherId: teacher.id,
    props: { pieceId: piece.id },
  });
  revalidatePath("/teacher");
  revalidatePath("/teacher/curriculum");
  return { id: piece.id, code: piece.code };
}

export async function updatePieceAssignment(input: {
  pieceId: string;
  title?: string;
  note?: string;
  tips?: string;
  goal?: string;
  dueAt?: string | null;
}) {
  const teacher = await teacherOrThrow();
  const piece = await prisma.piece.findFirst({
    where: { id: input.pieceId, teacherId: teacher.id, archived: false },
  });
  if (!piece) throw new Error("not found");
  const title = input.title?.trim();
  if (input.title != null && !title) return { error: "title_required" as const };
  const note = input.note?.trim() || null;
  const updated = await prisma.piece.update({
    where: { id: piece.id },
    data: {
      ...(title ? { title } : {}),
      ...(input.note != null ? { note, description: note } : {}),
      ...(input.tips != null ? { tips: input.tips.trim() || null } : {}),
      ...(input.goal !== undefined ? { goal: input.goal?.trim() || null } : {}),
      ...(input.dueAt !== undefined ? { dueAt: parseDueAt(input.dueAt) } : {}),
    },
  });
  revalidatePath("/teacher");
  revalidatePath("/teacher/curriculum");
  return { id: updated.id, code: updated.code };
}

export async function completePieceAssets(input: {
  pieceId: string;
  sheetMediaId?: string | null;
  tutorialMediaId?: string | null;
  clipMediaId?: string | null;
}) {
  const teacher = await teacherOrThrow();
  const piece = await prisma.piece.findFirst({
    where: { id: input.pieceId, teacherId: teacher.id, archived: false },
  });
  if (!piece) throw new Error("not found");

  const prefix = `teachers/${teacher.id}/pieces/${piece.id}/`;
  async function owned(mediaId: string | null | undefined, folder: "sheet" | "tutorial" | "clip") {
    if (!mediaId) return;
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media || media.storagePath === "pending") throw new Error("media not ready");
    if (!media.storagePath.startsWith(`${prefix}${folder}/`)) throw new Error("media mismatch");
  }

  await owned(input.sheetMediaId, "sheet");
  await owned(input.tutorialMediaId, "tutorial");
  await owned(input.clipMediaId, "clip");

  const updated = await linkPieceAssets({
    pieceId: piece.id,
    sheetMediaId: input.sheetMediaId ?? undefined,
    tutorialMediaId: input.tutorialMediaId ?? undefined,
    clipMediaId: input.clipMediaId ?? undefined,
  });

  let trained = false;
  if (input.sheetMediaId || input.tutorialMediaId) {
    if (updated.sheetMediaId || updated.tutorialMediaId) {
      await enqueueTrainPiece(updated.id);
      trained = true;
    }
  }

  await logEvent({
    name: "piece.assets_attached",
    actorType: "teacher",
    actorId: teacher.id,
    teacherId: teacher.id,
    props: {
      pieceId: piece.id,
      sheetMediaId: input.sheetMediaId ?? null,
      tutorialMediaId: input.tutorialMediaId ?? null,
      clipMediaId: input.clipMediaId ?? null,
      trained,
    },
  });
  revalidatePath("/teacher");
  revalidatePath("/teacher/curriculum");
  return { code: updated.code, trained };
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
  revalidatePath("/teacher");
  revalidatePath("/teacher/submissions");
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

  const guarded = guardReply({
    text: input.text,
    status: submission.status,
    existingReplyCount: submission.replies.length,
  });
  if ("error" in guarded) return guarded;
  const text = guarded.text;

  const draft = submission.drafts[0]?.text ?? null;
  const { source, editDistance } = classifyReplySource(draft, text);
  const openedAt = submission.reviewOpenedAt ?? new Date();
  const sentAt = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.submission.updateMany({
        where: { id: submission.id, status: { in: [...CLAIMABLE_SUBMISSION_STATUSES] } },
        data: {
          status: "answered",
          teacherPick: input.pick ? true : submission.teacherPick,
        },
      });
      if (claimed.count === 0) {
        throw new Error("STALE");
      }
      await tx.reply.create({
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
    });
  } catch (error) {
    if (error instanceof Error && error.message === "STALE") {
      return { error: "stale_item" as const };
    }
    throw error;
  }

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
  await maybeUnlockAiDirect(submission.pieceId);
  revalidatePath("/teacher");
  revalidatePath("/teacher/submissions");
  return { ok: true as const };
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
  revalidatePath("/teacher");
  revalidatePath("/teacher/submissions");
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
  revalidatePath("/teacher");
  revalidatePath("/teacher/submissions");
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

