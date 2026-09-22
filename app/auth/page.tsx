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
  searchParams: Promise<{ next?: string; role?: string; error?: string }>;
}) {
  const teacher = await getTeacherFromCookie();
  const student = await getStudentFromCookie();
  const { next: nextParam, role: roleParam, error: errorParam } = await searchParams;
  const next = nextParam?.startsWith("/") ? nextParam : null;
  const role = parseRole(roleParam);

  if (role === "tutor" && teacher) redirect(next && next.startsWith("/teacher") ? next : "/teacher");
  if (role === "student" && student) redirect(next && next.startsWith("/student") ? next : "/student");
  if (!role && teacher) redirect("/teacher");
  if (!role && student) redirect("/student");

  const locale = await getLocale();
  const t = await getMessages(locale);

  return (
    <main className="auth-stage">
      <header className="auth-edge">
        <Link href="/" aria-label={t.brand}>
          <BrandMark priority />
        </Link>
        <LocaleToggle locale={locale} />
      </header>

      <div className="auth-bars">
        {!role ? (
          <>
            <h1 className="auth-title">{t.auth.pickTitle}</h1>
            <Link href="/auth?role=tutor" className="auth-bar">
              <span>{t.auth.tutorTitle}</span>
            </Link>
            <Link href="/auth?role=student" className="auth-bar">
              <span>{t.auth.studentTitle}</span>
            </Link>
          </>
        ) : (
          <>
            <h1 className="auth-title">
              {role === "tutor" ? t.auth.tutorSignIn : t.auth.studentSignIn}
            </h1>
            <AuthForm
              role={role}
              next={next ?? (role === "student" ? "/student" : "/teacher")}
              initialError={
                errorParam === "role_mismatch"
                  ? role === "student"
                    ? t.auth.wrongRoleTutor
                    : t.auth.wrongRoleStudent
                  : null
              }
              labels={{
                email: t.auth.email,
                password: t.auth.password,
                signIn: t.auth.signIn,
                signUp: t.auth.signUp,
                checkEmail: t.auth.checkEmail,
                wrongRoleTutor: t.auth.wrongRoleTutor,
                wrongRoleStudent: t.auth.wrongRoleStudent,
                continueGoogle: t.auth.continueGoogle,
                continueFacebook: t.auth.continueFacebook,
                continueZalo: t.auth.continueZalo,
                orEmail: t.auth.orEmail,
                providerFailed: t.auth.providerFailed,
              }}
            />
            <Link href="/auth" className="auth-switch">
              {t.auth.switchRole}
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
