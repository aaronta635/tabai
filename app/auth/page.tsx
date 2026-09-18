import Link from "next/link";
import { redirect } from "next/navigation";
import { getStudentFromCookie, getTeacherFromCookie } from "@/lib/auth";
import { parseRole } from "@/lib/onboarding";
import { getLocale, getMessages } from "@/lib/i18n";
import { BrandMark } from "@/components/landing/brand-mark";
import { LocaleToggle } from "@/components/locale-toggle";
import { AuthForm } from "@/components/auth/auth-form";

export const dynamic = "force-dynamic";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; role?: string }>;
}) {
  const teacher = await getTeacherFromCookie();
  const student = await getStudentFromCookie();
  const { next: nextParam, role: roleParam } = await searchParams;
  const next = nextParam?.startsWith("/") ? nextParam : null;
  const role = parseRole(roleParam);

  if (teacher) redirect(next && next.startsWith("/teacher") ? next : "/teacher");
  if (student) redirect(next && next.startsWith("/student") ? next : "/student");

  const locale = await getLocale();
  const t = await getMessages(locale);
  const studio = role === "tutor";

  return (
    <main className={`${studio ? "teacher-onboard" : "student-shell"} mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16`}>
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" aria-label={t.brand}>
          {studio ? <BrandMark light /> : <BrandMark priority />}
        </Link>
        <LocaleToggle locale={locale} tone={studio ? "dark" : "light"} />
      </div>

      {!role ? (
        <>
          <h1 className="font-display text-4xl">{t.auth.pickTitle}</h1>
          <p className="mt-3 text-ink-soft">{t.auth.pickBody}</p>
          <div className="mt-8 grid gap-3">
            <Link
              href="/auth?role=tutor"
              className="rounded-2xl border border-ink/10 bg-cream px-5 py-5 hover:border-beat"
            >
              <p className="text-xs tracking-[0.16em] uppercase text-ink-soft">{t.auth.tutorKicker}</p>
              <p className="font-display mt-1 text-2xl">{t.auth.tutorTitle}</p>
              <p className="mt-2 text-sm text-ink-soft">{t.auth.tutorBody}</p>
            </Link>
            <Link
              href="/auth?role=student"
              className="rounded-2xl border border-ink/10 bg-cream px-5 py-5 hover:border-beat"
            >
              <p className="text-xs tracking-[0.16em] uppercase text-ink-soft">{t.auth.studentKicker}</p>
              <p className="font-display mt-1 text-2xl">{t.auth.studentTitle}</p>
              <p className="mt-2 text-sm text-ink-soft">{t.auth.studentBody}</p>
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className={`text-xs tracking-[0.18em] uppercase ${studio ? "text-white/55" : "text-ink-soft"}`}>
            {role === "tutor" ? t.auth.tutorKicker : t.auth.studentKicker}
          </p>
          <h1 className={`font-display mt-2 text-4xl ${studio ? "text-paper" : ""}`}>
            {role === "tutor" ? t.auth.tutorSignIn : t.auth.studentSignIn}
          </h1>
          <p className={`mt-3 ${studio ? "text-white/70" : "text-ink-soft"}`}>
            {role === "tutor" ? t.auth.tutorFormBody : t.auth.studentFormBody}
          </p>
          <div className={`mt-8 ${studio ? "lms-card p-5 text-ink" : ""}`}>
            <AuthForm
              role={role}
              next={next ?? (role === "student" ? "/student" : "/teacher")}
              labels={{
                email: t.auth.email,
                password: t.auth.password,
                signIn: t.auth.signIn,
                signUp: t.auth.signUp,
                checkEmail: t.auth.checkEmail,
              }}
            />
          </div>
          <Link href="/auth" className={`mt-6 text-sm ${studio ? "text-white/70" : "text-ink-soft"}`}>
            {t.auth.switchRole}
          </Link>
        </>
      )}
    </main>
  );
}
