import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { cachedById } from "@/lib/teacher-cache";
import { studentCountsTag } from "@/lib/student-cache";

export async function loadStudentWaitingCount(studentId: string) {
  return prisma.submission.count({
    where: { studentId, kind: { in: ["take", "overdub"] }, status: { in: ["new", "drafted"] } },
  });
}

export const studentWaitingCount = cache(async function studentWaitingCount(studentId: string) {
  return cachedById("student-waiting-count", studentId, [], [studentCountsTag(studentId)], 30, () =>
    loadStudentWaitingCount(studentId),
  );
});
