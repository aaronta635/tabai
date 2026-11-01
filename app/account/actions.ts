"use server";

import { redirect } from "next/navigation";
import { deleteStudentData, deleteTeacherAccount } from "@/lib/deletion";
import { readStudentSession, requireTeacher, signOutAccount } from "@/lib/auth";
import { signInPath } from "@/lib/return-path";

function confirmed(formData: FormData) {
  return formData.get("confirm") === "yes";
}

export async function deleteStudentAccount(formData: FormData) {
  if (!confirmed(formData)) return;
  const student = await readStudentSession();
  if (!student) redirect(signInPath("student"));
  await deleteStudentData(student.id);
  await signOutAccount();
  redirect(signInPath("student"));
}

export async function deleteTeacherAccountAction(formData: FormData) {
  if (!confirmed(formData)) return;
  const teacher = await requireTeacher();
  if (!teacher) redirect(signInPath("tutor"));
  await deleteTeacherAccount(teacher.id);
  await signOutAccount();
  redirect(signInPath("tutor"));
}
