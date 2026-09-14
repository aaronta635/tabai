import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { BrandMark } from "@/components/landing/brand-mark";
import { LocaleToggle } from "@/components/locale-toggle";
import { AuthForm } from "@/components/auth/auth-form";

export const dynamic = "force-dynamic";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const teacher = await requireTeacher();
  const { next: nextParam } = await searchParams;
  const next = nextParam?.startsWith("/") ? nextParam : "/teacher/pieces";
  if (teacher) redirect(next);

  const locale = await getLocale();
  const t = await getMessages(locale);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/">
          <BrandMark />
        </Link>
        <LocaleToggle locale={locale} />
      </div>
      <h1 className="font-display text-4xl">{t.auth.title}</h1>
      <p className="mt-3 text-[#6b6560]">{t.auth.body}</p>
      <div className="mt-8">
        <AuthForm
          next={next}
          labels={{
            email: t.auth.email,
            password: t.auth.password,
            signIn: t.auth.signIn,
            signUp: t.auth.signUp,
            checkEmail: t.auth.checkEmail,
          }}
        />
      </div>
    </main>
  );
}
