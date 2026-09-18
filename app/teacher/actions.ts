"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { newPieceCode, requireTeacher, signOutTeacher } from "@/lib/auth";
import { classifyReplySource } from "@/lib/edit-distance";
import { logEvent } from "@/lib/events";
import { Prisma } from "@prisma/client";
import { enqueueAnalyzeIfApproved } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { enqueueTrainPiece, linkPieceAssets, readCatalogSlot, syncPieceToCatalog } from "@/lib/catalog";
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
  redirect(`/teacher/pieces?created=${piece.code}`);
}

export async function createPieceRecord(input: { title: string; note: string; catalogSlug?: string }) {
  const teacher = await teacherOrThrow();
  const title = input.title.trim();
  const note = input.note.trim();
  if (!title) {
    // #region agent log
    fetch("http://127.0.0.1:7777/ingest/72b4f31c-651a-4621-bf28-9e2c74943a88", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "32cab8" },
      body: JSON.stringify({
        sessionId: "32cab8",
        runId: "teacher-verify",
        hypothesisId: "H-E06",
        location: "app/teacher/actions.ts:createPieceRecord",
        message: "title rejected",
        data: { rawLen: input.title.length, trimmedLen: title.length, result: "title_required" },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return { error: "title_required" as const };
  }

  const slot = input.catalogSlug ? await readCatalogSlot(input.catalogSlug) : null;
  if (input.catalogSlug && !slot) throw new Error("catalog slot not found");

  if (slot) {
    const existing = await prisma.piece.findUnique({ where: { code: slot.code } });
    if (existing && existing.teacherId !== teacher.id) {
      throw new Error("catalog piece belongs to another teacher");
    }
    if (existing) {
      const updated = await prisma.piece.update({
        where: { id: existing.id },
        data: { title, note: note || existing.note },
      });
      revalidatePath("/teacher");
      revalidatePath("/teacher/pieces");
      return { id: updated.id, code: updated.code };
    }
  }

  try {
    const piece = await prisma.piece.create({
      data: {
        teacherId: teacher.id,
        code: slot?.code ?? newPieceCode(),
        title,
        note: note || null,
      },
    });
    await logEvent({
      name: "piece.created",
      actorType: "teacher",
      actorId: teacher.id,
      teacherId: teacher.id,
      props: { pieceId: piece.id, catalogSlug: slot?.slug ?? null },
    });
    revalidatePath("/teacher");
    revalidatePath("/teacher/pieces");
    return { id: piece.id, code: piece.code };
  } catch (error) {
    if (slot && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.piece.findUnique({ where: { code: slot.code } });
      if (existing && existing.teacherId === teacher.id) {
        return { id: existing.id, code: existing.code };
      }
    }
    throw error;
  }
}

export async function completePieceAssets(input: {
  pieceId: string;
  sheetMediaId?: string | null;
  tutorialMediaId?: string | null;
}) {
  const teacher = await teacherOrThrow();
  const piece = await prisma.piece.findFirst({
    where: { id: input.pieceId, teacherId: teacher.id, archived: false },
  });
  if (!piece) throw new Error("not found");

  const prefix = `teachers/${teacher.id}/pieces/${piece.id}/`;
  async function owned(mediaId: string | null | undefined, folder: "sheet" | "tutorial") {
    if (!mediaId) return;
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media || media.storagePath === "pending") throw new Error("media not ready");
    if (!media.storagePath.startsWith(`${prefix}${folder}/`)) throw new Error("media mismatch");
  }

  await owned(input.sheetMediaId, "sheet");
  await owned(input.tutorialMediaId, "tutorial");

  const updated = await linkPieceAssets({
    pieceId: piece.id,
    sheetMediaId: input.sheetMediaId ?? undefined,
    tutorialMediaId: input.tutorialMediaId ?? undefined,
  });

  const catalogSlug = await syncPieceToCatalog(updated.id);

  let trained = false;
  if (updated.sheetMediaId && updated.tutorialMediaId) {
    await enqueueTrainPiece(updated.id, { catalogSlug });
    trained = true;
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
      catalogSlug,
      trained,
    },
  });
  revalidatePath("/teacher");
  revalidatePath("/teacher/pieces");
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
  const existingReplyCount = submission.replies.length;
  if (!text) {
    // #region agent log
    fetch("http://127.0.0.1:7777/ingest/72b4f31c-651a-4621-bf28-9e2c74943a88", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "32cab8" },
      body: JSON.stringify({
        sessionId: "32cab8",
        runId: "teacher-verify",
        hypothesisId: "H-Q06",
        location: "app/teacher/actions.ts:sendReply",
        message: "empty reply rejected",
        data: { rawLen: input.text.length, trimmedLen: text.length, result: "empty_reply" },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return { error: "empty_reply" as const };
  }
  if (submission.status === "answered" || submission.status === "skipped" || existingReplyCount > 0) {
    return { error: "stale_item" as const };
  }

  const draft = submission.drafts[0]?.text ?? null;
  const { source, editDistance } = classifyReplySource(draft, text);
  const openedAt = submission.reviewOpenedAt ?? new Date();
  const sentAt = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.submission.updateMany({
        where: { id: submission.id, status: { in: ["new", "drafted"] } },
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
      // #region agent log
      fetch("http://127.0.0.1:7777/ingest/72b4f31c-651a-4621-bf28-9e2c74943a88", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "32cab8" },
        body: JSON.stringify({
          sessionId: "32cab8",
          runId: "teacher-verify",
          hypothesisId: "H-Q12",
          location: "app/teacher/actions.ts:sendReply",
          message: "stale claim race",
          data: { result: "stale_item", via: "updateMany" },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
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
  revalidatePath("/teacher");
  revalidatePath("/teacher/queue");
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
  revalidatePath("/teacher");
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

