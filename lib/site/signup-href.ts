import { authPath } from "@/lib/return-path";
import { localePath, type Locale } from "@/lib/site/content";

/**
 * Every marketing "Try for free" / signup CTA opens TEACHER signup in the
 * current language: /en/signup/teacher, /vi/signup/teacher.
 * (Students join with a class code instead; see StudioEntry.)
 */
export function teacherSignupHref(locale: Locale) {
  return localePath(locale, authPath("signup", "tutor"));
}
