import { redirect } from "next/navigation";
import Link from "next/link";
import { requireStudentAccount, requireTeacher } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { BrandMark } from "@/components/landing/brand-mark";
import { LocaleToggle } from "@/components/locale-toggle";
import { StudentOnboardingForm, TutorOnboardingForm } from "@/components/onboarding/onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const teacher = await requireTeacher();
  const student = teacher ? null : await requireStudentAccount();
  if (!teacher && !student) redirect("/auth");
  if (teacher?.onboardedAt) redirect("/teacher");
  if (student?.onboardedAt) redirect("/student");

  const locale = await getLocale();
  const t = await getMessages(locale);
  const o = t.onboarding;

  return (
    <main className={teacher ? "teacher-onboard min-h-dvh" : "student-shell min-h-dvh"}>
      {teacher ? (
        <header className="teacher-rail flex items-center justify-between px-6 py-4 text-white">
          <Link href="/" aria-label={t.brand}>
            <BrandMark light />
          </Link>
          <LocaleToggle locale={locale} tone="dark" />
        </header>
      ) : (
        <div className="mx-auto flex max-w-md items-center justify-between px-6 pt-12">
          <Link href="/" aria-label={t.brand}>
            <BrandMark />
          </Link>
          <LocaleToggle locale={locale} />
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
        <div className={`mt-8 ${teacher ? "lms-card p-5 text-ink" : ""}`}>
          {teacher ? (
            <TutorOnboardingForm
              defaultName={teacher.name}
              labels={{
                name: o.name,
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
                contact: t.student.contact,
                zalo: t.student.zalo,
                messenger: t.student.messenger,
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
