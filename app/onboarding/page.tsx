import { redirect } from "next/navigation";
import Link from "next/link";
import { requireStudentAccount, requireTeacher } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { BrandMark } from "@/components/landing/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { getTheme } from "@/lib/theme";
import { StudentOnboardingForm, TutorOnboardingForm } from "@/components/onboarding/onboarding-form";
import { studioReturn } from "@/lib/return-path";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: nextParam } = await searchParams;
  const teacher = await requireTeacher();
  const student = teacher ? null : await requireStudentAccount();
  if (!teacher && !student) redirect("/login");
  const back = teacher
    ? studioReturn("tutor", nextParam)
    : studioReturn("student", nextParam);
  if (teacher?.onboardedAt) redirect(back ?? "/teacher");
  if (student?.onboardedAt) redirect(back ?? "/student");

  const locale = await getLocale();
  const theme = await getTheme();
  const t = await getMessages(locale);
  const o = t.onboarding;

  return (
    <main className={teacher ? "teacher-onboard setup-page min-h-dvh" : "student-shell setup-page min-h-dvh"}>
      {teacher ? (
        <header className="studio-rail flex items-center justify-between px-6 py-4 text-white">
          <Link href="/" aria-label={t.brand}>
            <BrandMark light />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} labels={{ light: t.theme.light, dark: t.theme.dark }} />
          </div>
        </header>
      ) : (
        <div className="mx-auto flex max-w-md items-center justify-between px-6 pt-12">
          <Link href="/" aria-label={t.brand}>
            <BrandMark />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} labels={{ light: t.theme.light, dark: t.theme.dark }} />
          </div>
        </div>
      )}
      <div className="mx-auto max-w-md px-6 py-10">
        <p className={`text-xs tracking-[0.18em] uppercase ${teacher ? "text-white/55" : "text-ink-soft"}`}>
          {teacher ? t.auth.tutorKicker : t.auth.studentKicker}
        </p>
        <h1 className={`font-display mt-2 text-3xl ${teacher ? "text-paper" : ""}`}>
          {teacher ? o.tutorTitle : o.studentTitle}
        </h1>
        <p className={`mt-3 ${teacher ? "text-white/70" : "text-ink-soft"}`}>
          {teacher ? o.tutorBody : o.studentBody}
        </p>
        <div className="setup-sheet">
          {teacher ? (
            <TutorOnboardingForm
              defaultName={teacher.name}
              returnTo={back ?? undefined}
              initialLocale={locale === "en" ? "en" : "vi"}
              labels={{
                name: o.name,
                feedbackLanguage: o.feedbackLanguage,
                feedbackVi: o.feedbackVi,
                feedbackEn: o.feedbackEn,
                q1: o.tutorQ1,
                q2: o.tutorQ2,
                q3: o.tutorQ3,
                videosZalo: o.videosZalo,
                videosInPerson: o.videosInPerson,
                videosNone: o.videosNone,
                sizeFew: o.sizeFew,
                sizeClass: o.sizeClass,
                sizeMany: o.sizeMany,
                focusBeat: o.focusBeat,
                focusNotes: o.focusNotes,
                focusBoth: o.focusBoth,
                continue: o.continue,
                incomplete: o.incomplete,
              }}
            />
          ) : student ? (
            <StudentOnboardingForm
              defaultName={student.name}
              returnTo={back ?? undefined}
              labels={{
                name: o.name,
                age: t.student.age,
                adult: t.student.adult,
                under18: t.student.under18,
                q1: o.studentQ1,
                q2: o.studentQ2,
                q3: o.studentQ3,
                codePlaceholder: t.home.codePlaceholder,
                playingWeeks: o.playingWeeks,
                playingMonths: o.playingMonths,
                playingYears: o.playingYears,
                workChords: o.workChords,
                workSong: o.workSong,
                workExam: o.workExam,
                phone: o.phone,
                phonePlaceholder: o.phonePlaceholder,
                continue: o.continue,
                incomplete: o.incomplete,
                badCode: o.badCode,
              }}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
