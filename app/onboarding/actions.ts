"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CONSENT_VERSION } from "@/lib/constants";
import {
  requireStudentAccount,
  requireTeacher,
  setStudentAccountCookies,
  setTeacherCookie,
  signOutAccount,
} from "@/lib/auth";
import {
  feedbackLocaleFrom,
  studentStageFromAnswers,
  tutorStageFromAnswers,
  type StudentAnswers,
  type TutorAnswers,
} from "@/lib/onboarding";
import { bindStudentToClass } from "@/lib/lms";
import { allowList, oneOf, SKILLS, TEACHING_SPAN, WEAKNESSES } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { authPath, onboardingNext, signInPath } from "@/lib/return-path";
import { claimPhone } from "@/lib/student-phone";

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function finish(role: "tutor" | "student", form: FormData, home: string) {
  redirect(onboardingNext(role, str(form, "next")) ?? home);
}

function phoneClash(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function saveTutorOnboarding(form: FormData) {
  const teacher = await requireTeacher();
  if (!teacher) redirect(signInPath("tutor", str(form, "next")));

  const name = str(form, "name") || teacher.name;
  const videos = str(form, "videos") as TutorAnswers["videos"];
  const size = str(form, "size") as TutorAnswers["size"];
  const focus = str(form, "focus") as TutorAnswers["focus"];
  if (str(form, "consent") !== "yes") return { error: "incomplete" };
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
      consentAt: new Date(),
      consentVersion: CONSENT_VERSION,
      feedbackLocale: feedbackLocaleFrom(str(form, "feedbackLocale")),
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
  const phone = await claimPhone(str(form, "contactHandle"), student.id);
  if ("error" in phone) return { error: phone.error };
  if (str(form, "consent") !== "yes") return { error: "incomplete" };
  if (!["weeks", "months", "years"].includes(playing)) return { error: "incomplete" };
  if (!["chords", "song", "exam"].includes(work)) return { error: "incomplete" };

  let teacherId = student.teacherId;
  if (code) {
    const joined = await bindStudentToClass(student.id, code);
    if ("error" in joined) return { error: "code" as const };
    teacherId = student.teacherId ?? joined.class.teacherId;
  }

  const answers: StudentAnswers = {
    playing,
    work,
    code: code || undefined,
    skills: allowList(form.getAll("skills"), SKILLS),
    weaknesses: allowList(form.getAll("weaknesses"), WEAKNESSES),
  };
  const stage = studentStageFromAnswers(answers, Boolean(teacherId));
  let updated;
  try {
    updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        name,
        ageBand,
        contactType,
        contactHandle: phone.contactHandle,
        phoneKey: phone.phoneKey,
        teacherId,
        stage,
        answersJson: answers,
        onboardedAt: new Date(),
        consentAt: new Date(),
        consentVersion: CONSENT_VERSION,
      },
    });
  } catch (error) {
    if (phoneClash(error)) return { error: "phone_taken" as const };
    throw error;
  }
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
  const phone = await claimPhone(str(form, "contactHandle"), student.id);
  if ("error" in phone) return { error: phone.error };
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
  let updated;
  try {
    updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        name,
        ageBand,
        contactHandle: phone.contactHandle,
        phoneKey: phone.phoneKey,
        answersJson: answers,
      },
    });
  } catch (error) {
    if (phoneClash(error)) return { error: "phone_taken" as const };
    throw error;
  }
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
  const existing = await requireStudentAccount();
  if (existing) {
    if (!code) return { error: "code" };
    const joined = await bindStudentToClass(existing.id, code);
    if ("error" in joined) return { error: joined.error };
    redirect(existing.onboardedAt ? "/student" : "/onboarding");
  }
  if (!code) return { error: "code" };
  redirect(authPath("signup", "student", `/join/${code}`));
}

export async function saveAvatar(path: string, role: "teacher" | "student") {
  const clean = path.trim();
  if (role === "teacher") {
    const teacher = await requireTeacher();
    if (!teacher || !clean.startsWith(`avatars/teachers/${teacher.id}/`)) return { error: "unauthorized" as const };
    await prisma.teacher.update({ where: { id: teacher.id }, data: { avatarUrl: clean } });
    revalidatePath("/teacher", "layout");
    revalidatePath("/teacher/profile");
    return { ok: true as const };
  }
  const student = await requireStudentAccount();
  if (!student || !clean.startsWith(`avatars/students/${student.id}/`)) return { error: "unauthorized" as const };
  await prisma.student.update({ where: { id: student.id }, data: { avatarUrl: clean } });
  revalidatePath("/student", "layout");
  revalidatePath("/student/profile");
  return { ok: true as const };
}

export async function logoutAccount() {
  await signOutAccount();
  redirect("/");
}
