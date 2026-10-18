"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CONSENT_VERSION } from "@/lib/constants";
import {
  newStudentToken,
  requireStudentAccount,
  requireTeacher,
  setStudentAccountCookies,
  setTeacherCookie,
  signOutAccount,
} from "@/lib/auth";
import {
  studentStageFromAnswers,
  tutorStageFromAnswers,
  type StudentAnswers,
  type TutorAnswers,
} from "@/lib/onboarding";
import { bindStudentToClass } from "@/lib/lms";
import { allowList, oneOf, SKILLS, TEACHING_SPAN, WEAKNESSES } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { newReportToken } from "@/lib/report";
import { signInPath, studioReturn } from "@/lib/return-path";

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function finish(role: "tutor" | "student", form: FormData, home: string) {
  redirect(studioReturn(role, str(form, "next")) ?? home);
}

export async function saveTutorOnboarding(form: FormData) {
  const teacher = await requireTeacher();
  if (!teacher) redirect(signInPath("tutor", str(form, "next")));

  const name = str(form, "name") || teacher.name;
  const videos = str(form, "videos") as TutorAnswers["videos"];
  const size = str(form, "size") as TutorAnswers["size"];
  const focus = str(form, "focus") as TutorAnswers["focus"];
  if (!["zalo", "in_person", "none"].includes(videos)) return { error: "incomplete" };
  if (!["few", "class", "many"].includes(size)) return { error: "incomplete" };
  if (!["beat", "notes", "both"].includes(focus)) return { error: "incomplete" };

  const answers: TutorAnswers = {
    videos,
    size,
    focus,
    teaching: oneOf(str(form, "teaching"), TEACHING_SPAN, "some"),
    skills: allowList(form.getAll("skills"), SKILLS),
    weaknesses: allowList(form.getAll("weaknesses"), WEAKNESSES),
  };
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
  await setTeacherCookie(teacher.id, name, true);
  finish("tutor", form, "/teacher");
}

export async function saveStudentOnboarding(form: FormData) {
  const student = await requireStudentAccount();
  if (!student) redirect(signInPath("student", str(form, "next")));

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
    const joined = await bindStudentToClass(student.id, code);
    if ("error" in joined) return { error: joined.error === "otherClass" ? "otherClass" : "code" };
    teacherId = joined.class.teacherId;
  }

  const answers: StudentAnswers = {
    playing,
    work,
    code: code || undefined,
    skills: allowList(form.getAll("skills"), SKILLS),
    weaknesses: allowList(form.getAll("weaknesses"), WEAKNESSES),
  };
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
  await setStudentAccountCookies(updated.id, updated.name, updated.token, true, updated.authUserId);
  finish("student", form, "/student");
}

export async function updateStudentProfile(form: FormData) {
  const student = await requireStudentAccount();
  if (!student) redirect(signInPath("student", "/student"));
  const name = str(form, "name") || student.name;
  const ageBand = str(form, "ageBand") === "under18" ? "under18" : "adult";
  const playing = oneOf(str(form, "playing"), ["weeks", "months", "years"] as const, "months");
  const work = oneOf(str(form, "work"), ["chords", "song", "exam"] as const, "song");
  const contactHandle = str(form, "contactHandle") || student.contactHandle;
  const previous =
    student.answersJson && typeof student.answersJson === "object" && !Array.isArray(student.answersJson)
      ? (student.answersJson as StudentAnswers)
      : undefined;
  const answers: StudentAnswers = {
    playing,
    work,
    code: previous?.code,
    skills: allowList(form.getAll("skills"), SKILLS),
    weaknesses: allowList(form.getAll("weaknesses"), WEAKNESSES),
  };
  const updated = await prisma.student.update({
    where: { id: student.id },
    data: { name, ageBand, contactHandle, answersJson: answers },
  });
  await setStudentAccountCookies(updated.id, updated.name, updated.token, true, updated.authUserId);
  revalidateStudent();
}

function revalidateStudent() {
  revalidatePath("/student");
  revalidatePath("/student/profile");
}

export async function joinStudentClass(form: FormData) {
  const student = await requireStudentAccount();
  if (!student) redirect(signInPath("student", "/student"));
  const code = str(form, "code").toLowerCase();
  if (!code) return { error: "code" };
  const joined = await bindStudentToClass(student.id, code);
  if ("error" in joined) return { error: joined.error };
  redirect("/student");
}

export async function guestJoinClass(form: FormData) {
  const code = str(form, "code").toLowerCase();
  const name = str(form, "name");
  const contactHandle = str(form, "contactHandle");
  const ageBand = str(form, "ageBand") === "under18" ? "under18" : "adult";
  const contactType = str(form, "contactType") === "messenger" ? "messenger" : "zalo";
  const consent = str(form, "consent") === "yes";
  if (!code || !name || !contactHandle || !consent) return { error: "code" };

  const existing = await requireStudentAccount();
  if (existing) {
    const joined = await bindStudentToClass(existing.id, code);
    if ("error" in joined) return { error: joined.error };
    redirect(existing.onboardedAt ? "/student" : "/onboarding");
  }

  const studioClass = await prisma.class.findUnique({ where: { code } });
  if (!studioClass || studioClass.archived) return { error: "code" };

  const token = newStudentToken();
  const student = await prisma.student.create({
    data: {
      teacherId: studioClass.teacherId,
      name,
      ageBand,
      contactType,
      contactHandle,
      token,
      reportToken: newReportToken(),
      consentAt: new Date(),
      consentVersion: CONSENT_VERSION,
      publicOk: false,
      stage: "in_class",
      onboardedAt: new Date(),
    },
  });
  const joined = await bindStudentToClass(student.id, code);
  if ("error" in joined) return { error: joined.error };
  await setStudentAccountCookies(student.id, student.name, token, true, student.authUserId);
  redirect("/student");
}

export async function logoutAccount() {
  await signOutAccount();
  redirect("/");
}
