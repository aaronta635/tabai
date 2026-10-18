"use server";

import { revalidatePath } from "next/cache";
import { readStudentSession } from "@/lib/auth";
import { deleteOwnTake as removeOwnTake } from "@/lib/deletion";

export async function deleteOwnTake(submissionId: string) {
  const student = await readStudentSession();
  if (!student) throw new Error("unauthorized");
  await removeOwnTake({ studentId: student.id, submissionId });
  revalidatePath("/student");
  revalidatePath("/student/takes");
  revalidatePath(`/student/takes/${submissionId}`);
}
