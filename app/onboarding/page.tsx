import { redirect } from "next/navigation";
import Link from "next/link";
import { requireStudentAccount, requireTeacher } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { BrandMark } from "@/components/landing/brand-mark";
import { LocaleSwitch } from "@/components/locale-switch";
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
  const t = await getMessages(locale);
  const o = t.onboarding;

  return (
    <main className="setup-wash setup-page min-h-dvh">
      <div className="mx-auto flex max-w-md items-center justify-between px-6 pt-8">
        <Link href="/" aria-label={t.brand}>
          <BrandMark />
        </Link>
        <LocaleSwitch labels={{ language: t.theme.language, en: t.locale.en, vi: t.locale.vi }} />
      </div>
      <div className="mx-auto max-w-md px-6 py-10">
        <p className="text-xs tracking-[0.18em] uppercase text-ink-soft">
          {teacher ? t.auth.tutorKicker : t.auth.studentKicker}
        </p>
        <div className="setup-sheet">
          {teacher ? (
            <TutorOnboardingForm
              defaultName={teacher.name}
              returnTo={back ?? undefined}
              locale={locale === "en" ? "en" : "vi"}
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
              locale={locale === "en" ? "en" : "vi"}
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
