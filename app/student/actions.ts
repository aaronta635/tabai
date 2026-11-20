"use server";

import { revalidatePath } from "next/cache";
import { readStudentSession } from "@/lib/auth";
import { deleteOwnTake as removeOwnTake } from "@/lib/deletion";
import { promotePracticeToTake } from "@/lib/promote-practice";

export async function deleteOwnTake(submissionId: string) {
  const student = await readStudentSession();
  if (!student) throw new Error("unauthorized");
  await removeOwnTake({ studentId: student.id, submissionId });
  revalidatePath("/student");
  revalidatePath("/student/takes");
  revalidatePath(`/student/takes/${submissionId}`);
}

export async function sendPracticeToTeacher(submissionId: string) {
  const student = await readStudentSession();
  if (!student) return { error: "unauthorized" as const };
  const result = await promotePracticeToTake({ studentId: student.id, submissionId });
  if ("error" in result) return result;
  revalidatePath("/student");
  revalidatePath("/student/takes");
  revalidatePath(`/student/takes/${result.id}`);
  revalidatePath(`/student/work/${result.pieceCode}`);
  revalidatePath(`/student/work/${result.pieceCode}/practice`);
  return result;
}
