import { revalidateTag, unstable_cache } from "next/cache";

export function teacherCountsTag(teacherId: string) {
  return `teacher:${teacherId}:counts`;
}

export function teacherPulseTag(teacherId: string) {
  return `teacher:${teacherId}:pulse`;
}

export function revalidateTeacherHotPath(teacherId: string) {
  revalidateTag(teacherCountsTag(teacherId));
  revalidateTag(teacherPulseTag(teacherId));
}

export function cachedById<T>(
  key: string,
  id: string,
  extraKey: string[],
  tags: string[],
  revalidate: number,
  load: () => Promise<T>,
) {
  return unstable_cache(load, [key, id, ...extraKey], { revalidate, tags })();
}
