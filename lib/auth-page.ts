import { redirect } from "next/navigation";
import { getStudentFromCookie, getTeacherFromCookie } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import type { AccountRole } from "@/lib/onboarding";
import { safeReturn, studioReturn } from "@/lib/return-path";
import { getTheme } from "@/lib/theme";

export async function prepareAuthPage(role: AccountRole, search: { next?: string; error?: string }) {
  const teacher = await getTeacherFromCookie();
  const student = await getStudentFromCookie();

  if (role === "tutor" && teacher) redirect(studioReturn("tutor", search.next) ?? "/teacher");
  if (role === "student" && student) redirect(studioReturn("student", search.next) ?? "/student");

  const next = safeReturn(role, search.next) ?? (role === "student" ? "/student" : "/teacher");
  const locale = await getLocale();
  const theme = await getTheme();
  const t = await getMessages(locale);
  const initialError =
    search.error === "role_mismatch"
      ? role === "student"
        ? t.auth.wrongRoleTutor
        : t.auth.wrongRoleStudent
      : null;

  return { role, next, locale, theme, t, initialError };
}
