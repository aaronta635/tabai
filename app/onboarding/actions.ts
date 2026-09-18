"use server";

import { redirect } from "next/navigation";
import { CONSENT_VERSION } from "@/lib/constants";
import { requireStudentAccount, requireTeacher, setStudentAccountCookies, setTeacherCookie, signOutAccount } from "@/lib/auth";
import {
  studentStageFromAnswers,
  tutorStageFromAnswers,
  type StudentAnswers,
  type TutorAnswers,
} from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export async function saveTutorOnboarding(form: FormData) {
  const teacher = await requireTeacher();
  if (!teacher) redirect("/auth?role=tutor");

  const name = str(form, "name") || teacher.name;
  const videos = str(form, "videos") as TutorAnswers["videos"];
  const size = str(form, "size") as TutorAnswers["size"];
  const focus = str(form, "focus") as TutorAnswers["focus"];
  if (!["zalo", "in_person", "none"].includes(videos)) return { error: "incomplete" };
  if (!["few", "class", "many"].includes(size)) return { error: "incomplete" };
  if (!["beat", "notes", "both"].includes(focus)) return { error: "incomplete" };

  const answers: TutorAnswers = { videos, size, focus };
  const stage = tutorStageFromAnswers(answers);
  await prisma.teacher.update({
    where: { id: teacher.id },
    data: {
      name,
      stage,
      answersJson: answers,
      onboardedAt: new Date(),
      deliveryType: videos === "zalo" ? "zalo" : teacher.deliveryType,
    },
  });
  await setTeacherCookie(teacher.id, name);
  redirect("/teacher");
}

export async function saveStudentOnboarding(form: FormData) {
  const student = await requireStudentAccount();
  if (!student) redirect("/auth?role=student");

  const name = str(form, "name") || student.name;
  const ageBand = str(form, "ageBand") === "under18" ? "under18" : "adult";
  const playing = str(form, "playing") as StudentAnswers["playing"];
  const work = str(form, "work") as StudentAnswers["work"];
  const code = str(form, "code").toLowerCase();
  const contactType = str(form, "contactType") === "messenger" ? "messenger" : "zalo";
  const contactHandle = str(form, "contactHandle") || student.contactHandle;
  if (!["weeks", "months", "years"].includes(playing)) return { error: "incomplete" };
  if (!["chords", "song", "exam"].includes(work)) return { error: "incomplete" };

  let teacherId = student.teacherId;
  if (code) {
    const piece = await prisma.piece.findUnique({ where: { code } });
    if (!piece || piece.archived) return { error: "code" };
    teacherId = piece.teacherId;
  }

  const answers: StudentAnswers = { playing, work, code: code || undefined };
  const stage = studentStageFromAnswers(answers, Boolean(teacherId));
  const updated = await prisma.student.update({
    where: { id: student.id },
    data: {
      name,
      ageBand,
      contactType,
      contactHandle,
      teacherId,
      stage,
      answersJson: answers,
      onboardedAt: new Date(),
      consentAt: student.consentAt ?? new Date(),
      consentVersion: student.consentVersion || CONSENT_VERSION,
    },
  });
  await setStudentAccountCookies(updated.id, updated.name, updated.token);
  redirect("/student");
}

export async function joinStudentClass(form: FormData) {
  const student = await requireStudentAccount();
  if (!student) redirect("/auth?role=student");
  const code = str(form, "code").toLowerCase();
  if (!code) return { error: "code" };
  const piece = await prisma.piece.findUnique({ where: { code } });
  if (!piece || piece.archived) return { error: "code" };
  if (student.teacherId && student.teacherId !== piece.teacherId) return { error: "otherClass" };
  await prisma.student.update({
    where: { id: student.id },
    data: { teacherId: piece.teacherId, stage: "in_class" },
  });
  redirect(`/l/${piece.code}`);
}

export async function logoutAccount() {
  await signOutAccount();
  redirect("/");
}
