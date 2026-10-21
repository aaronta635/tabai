import { notFound } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { prepareAuthPage } from "@/lib/auth-page";
import { parseAuthSegment } from "@/lib/return-path";

export const dynamic = "force-dynamic";

export default async function LoginRolePage({
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
      themeLabels={{ light: t.theme.light, dark: t.theme.dark }}
    >
      <LoginForm
        initialRole={ready.role}
        next={ready.next}
        initialError={ready.initialError}
        labels={{
          welcome: t.auth.welcome,
          welcomeSub: t.auth.welcomeSub,
          iAm: t.auth.iAm,
          teacher: t.auth.teacher,
          student: t.auth.student,
          email: t.auth.email,
          password: t.auth.password,
          signInAs: t.auth.signInAs,
          wrongRoleTutor: t.auth.wrongRoleTutor,
          wrongRoleStudent: t.auth.wrongRoleStudent,
          google: t.auth.google,
          facebook: t.auth.facebook,
          zalo: t.auth.zalo,
          orWithEmail: t.auth.orWithEmail,
          forgot: t.auth.forgot,
          forgotNeedEmail: t.auth.forgotNeedEmail,
          resetSent: t.auth.resetSent,
          newHere: t.auth.newHere,
          createLink: t.auth.createLink,
          providerFailed: t.auth.providerFailed,
        }}
      />
    </AuthShell>
  );
}
