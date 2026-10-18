import { notFound } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { prepareAuthPage } from "@/lib/auth-page";
import { parseAuthSegment } from "@/lib/return-path";

export const dynamic = "force-dynamic";

export default async function SignupRolePage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const role = parseAuthSegment((await params).role);
  if (!role) notFound();
  const ready = await prepareAuthPage(role, await searchParams);
  const t = ready.t;

  return (
    <AuthShell
      brand={t.brand}
      manifesto={t.auth.manifesto}
      kicker={t.auth.manifestoKicker}
      footer={t.auth.roomFooter}
      theme={ready.theme}
      locale={ready.locale}
      themeLabels={{ light: t.theme.light, dark: t.theme.dark }}
    >
      <SignupForm
        initialRole={ready.role}
        next={ready.next}
        initialError={ready.initialError}
        labels={{
          createTitle: t.auth.createTitle,
          createSub: t.auth.createSub,
          iAm: t.auth.iAm,
          teacher: t.auth.teacher,
          student: t.auth.student,
          email: t.auth.email,
          password: t.auth.password,
          signUpAs: t.auth.signUpAs,
          checkEmail: t.auth.checkEmail,
          wrongRoleTutor: t.auth.wrongRoleTutor,
          wrongRoleStudent: t.auth.wrongRoleStudent,
          google: t.auth.google,
          facebook: t.auth.facebook,
          zalo: t.auth.zalo,
          orWithEmail: t.auth.orWithEmail,
          haveAccount: t.auth.haveAccount,
          signInLink: t.auth.signInLink,
          providerFailed: t.auth.providerFailed,
        }}
      />
    </AuthShell>
  );
}
