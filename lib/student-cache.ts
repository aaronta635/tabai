import { revalidateTag } from "next/cache";

export function studentCountsTag(studentId: string) {
  return `student:${studentId}:counts`;
}

export function revalidateStudentHotPath(studentId: string) {
  revalidateTag(studentCountsTag(studentId));
}
