"use server";

import { revalidatePath } from "next/cache";
import { newInviteToken, requireAdmin } from "@/lib/auth";
import { MAX_ACTIVE_VOICE_SAMPLES } from "@/lib/constants";
import { deleteStudentData } from "@/lib/deletion";
import { logEvent } from "@/lib/events";
import { prisma } from "@/lib/prisma";

async function adminOrThrow() {
  const ok = await requireAdmin();
  if (!ok) throw new Error("unauthorized");
}

export async function createTeacher(formData: FormData) {
  await adminOrThrow();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("name required");
  const teacher = await prisma.teacher.create({
    data: { name, inviteToken: newInviteToken() },
  });
  await logEvent({
    name: "teacher.created",
    actorType: "admin",
    teacherId: teacher.id,
    props: { name },
  });
  revalidatePath("/admin");
}

export async function pasteVoiceSamples(formData: FormData) {
  await adminOrThrow();
  const teacherId = String(formData.get("teacherId") ?? "");
  const raw = String(formData.get("samples") ?? "");
  const lines = raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!teacherId || lines.length === 0) throw new Error("samples required");

  await prisma.voiceSample.createMany({
    data: lines.map((text) => ({
      teacherId,
      text,
      source: "pasted" as const,
      active: true,
    })),
  });

  const active = await prisma.voiceSample.findMany({
    where: { teacherId, active: true },
    orderBy: { createdAt: "desc" },
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
    actorType: "admin",
    teacherId,
    props: { count: lines.length },
  });
  revalidatePath("/admin/voices");
}

export async function curateReply(replyId: string) {
  await adminOrThrow();
  const reply = await prisma.reply.findUnique({ where: { id: replyId } });
  if (!reply) throw new Error("not found");
  const activeCount = await prisma.voiceSample.count({
    where: { teacherId: reply.teacherId, active: true },
  });
  await prisma.voiceSample.create({
    data: {
      teacherId: reply.teacherId,
      text: reply.text,
      source: "curated_from_reply",
      active: activeCount < MAX_ACTIVE_VOICE_SAMPLES,
    },
  });
  await logEvent({
    name: "voice.curated",
    actorType: "admin",
    teacherId: reply.teacherId,
    props: { replyId },
  });
  revalidatePath("/admin/voices");
}

export async function toggleVoice(id: string) {
  await adminOrThrow();
  const sample = await prisma.voiceSample.findUnique({ where: { id } });
  if (!sample) throw new Error("not found");
  await prisma.voiceSample.update({
    where: { id },
    data: { active: !sample.active },
  });
  revalidatePath("/admin/voices");
}

export async function deleteStudent(formData: FormData) {
  await adminOrThrow();
  const studentId = String(formData.get("studentId") ?? "");
  if (!studentId) throw new Error("studentId required");
  await deleteStudentData(studentId);
  revalidatePath("/admin");
}
