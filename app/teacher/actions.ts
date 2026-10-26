"use server";

import { revalidatePath } from "next/cache";
import { revalidateTeacherHotPath } from "@/lib/teacher-cache";
import { revalidateStudentHotPath } from "@/lib/student-cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { newPieceCode, requireTeacher, signOutTeacher } from "@/lib/auth";
import { classifyReplySource } from "@/lib/edit-distance";
import { logEvent } from "@/lib/events";
import { maybeRelockAiDirect, maybeUnlockAiDirect } from "@/lib/growth";
import { enqueueAnalyzeIfApproved, enqueueDraftWhenReady } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { CLAIMABLE_SUBMISSION_STATUSES, guardReply, pieceTitleResult, replyGrade, statusAfterRevert } from "@/lib/forms";
import { highlightStart, joinStoryLetter } from "@/lib/report";
import { MAX_ACTIVE_VOICE_SAMPLES } from "@/lib/constants";
import { parseDueAt } from "@/lib/practice";
import { enqueueTrainPiece, linkPieceAssets } from "@/lib/catalog";
import { teacherSubmission } from "@/lib/scope";
import { deleteTeacherTake as removeTeacherTake } from "@/lib/deletion";
import { applyIssueVerdict, latestFactVerdictAt, observationMarkers, parseCompareObservations } from "@/lib/score-model";

async function teacherOrThrow() {
  const teacher = await requireTeacher();
  if (!teacher) throw new Error("unauthorized");
  return teacher;
}

function revalidateTeacherQueue(teacherId: string, studentId?: string) {
  revalidateTeacherHotPath(teacherId);
  if (studentId) revalidateStudentHotPath(studentId);
  revalidatePath("/teacher");
  revalidatePath("/teacher/submissions");
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
  if (partId) {
    const part = await prisma.curriculumPart.findFirst({
      where: { id: partId, teacherId: teacher.id },
      select: { id: true },
    });
    if (!part) throw new Error("not found");
  } else {
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

export async function approveStudentForm(formData: FormData) {
  await approveStudent(String(formData.get("studentId") ?? ""));
}

export async function approveStudent(studentId: string) {
  const teacher = await teacherOrThrow();
  const student = await prisma.student.findFirst({
    where: { id: studentId, teacherId: teacher.id },
  });
  if (!student) throw new Error("not found");

  const approvedAt = student.approvedAt ?? new Date();
  await prisma.student.update({
    where: { id: studentId },
    data: { approvedAt },
  });
  await prisma.classMembership.updateMany({
    where: { studentId, class: { teacherId: teacher.id }, approvedAt: null },
    data: { approvedAt },
  });

  const pending = await prisma.submission.findMany({
    where: { studentId, status: "new", piece: { teacherId: teacher.id } },
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
  revalidateTeacherQueue(teacher.id, studentId);
  revalidatePath("/teacher/roster");
  revalidatePath("/teacher/classes", "layout");
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
  text?: string;
  pick?: boolean;
  grade?: string | null;
  highlightStartS?: number | null;
  progressNote?: string | null;
  keyPoint?: string | null;
  nextStep?: string | null;
}) {
  const teacher = await teacherOrThrow();
  const submission = await teacherSubmission(teacher.id, input.submissionId);
  if (!submission) throw new Error("not found");
  const grade = replyGrade(input.grade);
  if (grade === undefined) return { error: "bad_grade" as const };
  const progressNote = (input.progressNote ?? "").trim() || null;
  const keyPoint = (input.keyPoint ?? "").trim() || null;
  const nextStep = (input.nextStep ?? "").trim() || null;
  const story = joinStoryLetter({ progress: progressNote, keyPoint, nextStep });

  const guarded = guardReply({
    text: story || input.text || "",
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
          highlightStartS: highlightStart(input.highlightStartS),
          progressNote,
          keyPoint,
          nextStep,
          grade,
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
  await maybeRelockAiDirect(submission.pieceId);
  revalidateTeacherQueue(teacher.id, submission.studentId);
  return { ok: true as const };
}

export async function revertReply(submissionId: string) {
  const teacher = await teacherOrThrow();
  const submission = await teacherSubmission(teacher.id, submissionId);
  if (!submission) throw new Error("not found");
  const reply = submission.replies[0];
  if (submission.status !== "answered" || !reply) return { error: "stale_item" as const };

  const nextStatus = statusAfterRevert(submission.drafts.length > 0);
  try {
    await prisma.$transaction(async (tx) => {
      const removed = await tx.reply.deleteMany({
        where: { id: reply.id, teacherId: teacher.id, submissionId: submission.id },
      });
      if (removed.count !== 1) throw new Error("STALE");
      const restored = await tx.submission.updateMany({
        where: { id: submission.id, status: "answered" },
        data: { status: nextStatus },
      });
      if (restored.count !== 1) throw new Error("STALE");
    });
  } catch (error) {
    if (error instanceof Error && error.message === "STALE") {
      return { error: "stale_item" as const };
    }
    throw error;
  }

  await logEvent({
    name: "reply.reverted",
    actorType: "teacher",
    actorId: teacher.id,
    teacherId: teacher.id,
    props: { submissionId: submission.id },
  });
  revalidateTeacherQueue(teacher.id, submission.studentId);
  revalidatePath(`/teacher/submissions/${submission.id}`);
  revalidatePath("/student/takes");
  revalidatePath(`/student/takes/${submission.id}`);
  return { ok: true as const };
}

export async function setIssueVerdict(input: {
  submissionId: string;
  issueIndex: number;
  verdict: "true" | "false" | null;
}) {
  const teacher = await teacherOrThrow();
  const submission = await teacherSubmission(teacher.id, input.submissionId);
  if (!submission) throw new Error("not found");
  const analysis = submission.analyses[0];
  if (!analysis?.observationsJson) return { error: "no_facts" as const };
  const next = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Analysis" WHERE id = ${analysis.id} FOR UPDATE`;
    const locked = await tx.analysis.findUnique({ where: { id: analysis.id } });
    if (!locked?.observationsJson) return null;
    const applied = applyIssueVerdict(
      parseCompareObservations(locked.observationsJson),
      input.issueIndex,
      input.verdict,
    );
    if (!applied) return null;
    await tx.analysis.update({
      where: { id: analysis.id },
      data: { observationsJson: applied as unknown as Prisma.InputJsonValue },
    });
    return applied;
  });
  if (!next) return { error: "no_facts" as const };
  const job = await enqueueDraftWhenReady(submission.id);
  const issue = next.issues[input.issueIndex];
  const metrics = analysis.metricsJson;
  const overlayVersion =
    metrics && typeof metrics === "object" && !Array.isArray(metrics)
      ? (metrics as { pitch_overlay_version?: unknown }).pitch_overlay_version
      : null;
  await logEvent({
    name: "fact.verdict",
    actorType: "teacher",
    actorId: teacher.id,
    teacherId: teacher.id,
    props: {
      submissionId: submission.id,
      pieceId: submission.pieceId,
      issueIndex: input.issueIndex,
      type: issue?.type ?? "unknown",
      expected: issue?.expected ?? "",
      observed: issue?.observed ?? "",
      verdict: input.verdict ?? "none",
      pitchOverlayVersion: typeof overlayVersion === "string" ? overlayVersion : null,
      draftQueued: Boolean(job),
    },
  });
  return {
    ok: true as const,
    draftQueued: Boolean(job),
    latestVerdictAt: latestFactVerdictAt(observationMarkers(next)),
  };
}

export async function requestDraft(submissionId: string) {
  const teacher = await teacherOrThrow();
  const submission = await teacherSubmission(teacher.id, submissionId);
  if (!submission) throw new Error("not found");
  const job = await enqueueDraftWhenReady(submission.id);
  return { ok: true as const, draftQueued: Boolean(job) };
}

export async function peekDraft(submissionId: string) {
  const teacher = await teacherOrThrow();
  const submission = await teacherSubmission(teacher.id, submissionId);
  if (!submission) throw new Error("not found");
  const draft = await prisma.draft.findFirst({
    where: { submissionId },
    orderBy: { createdAt: "desc" },
    select: { text: true, createdAt: true },
  });
  return {
    text: draft?.text ?? null,
    createdAt: draft?.createdAt.toISOString() ?? null,
  };
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
  revalidateTeacherQueue(teacher.id, submission.studentId);
}

export async function deleteTeacherTake(submissionId: string) {
  const teacher = await teacherOrThrow();
  const submission = await teacherSubmission(teacher.id, submissionId);
  if (!submission) throw new Error("not found");
  await removeTeacherTake({ teacherId: teacher.id, submissionId });
  revalidateTeacherQueue(teacher.id, submission.studentId);
  revalidatePath(`/teacher/submissions/${submissionId}`);
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

export async function addVoiceSamples(formData: FormData) {
  const teacher = await teacherOrThrow();
  const lines = String(formData.get("samples") ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return;

  await prisma.voiceSample.createMany({
    data: lines.map((text) => ({
      teacherId: teacher.id,
      text,
      source: "pasted" as const,
      active: true,
    })),
  });

  const active = await prisma.voiceSample.findMany({
    where: { teacherId: teacher.id, active: true },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (active.length > MAX_ACTIVE_VOICE_SAMPLES) {
    const extra = active.slice(MAX_ACTIVE_VOICE_SAMPLES);
    await prisma.voiceSample.updateMany({
      where: { id: { in: extra.map((row) => row.id) } },
      data: { active: false },
    });
  }

  await logEvent({
    name: "voice.pasted",
    actorType: "teacher",
    actorId: teacher.id,
    teacherId: teacher.id,
    props: { count: lines.length },
  });
  revalidatePath("/teacher/settings");
}

export async function retireVoice(formData: FormData) {
  const teacher = await teacherOrThrow();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.voiceSample.updateMany({
    where: { id, teacherId: teacher.id, active: true },
    data: { active: false },
  });
  revalidatePath("/teacher/settings");
}

export async function logoutTeacher() {
  await signOutTeacher();
  redirect("/");
}

