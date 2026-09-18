import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStudentAccount } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { BrandMark } from "@/components/landing/brand-mark";
import { LocaleToggle } from "@/components/locale-toggle";
import { logoutAccount } from "@/app/onboarding/actions";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const student = await requireStudentAccount();
  if (!student) redirect("/api/session?next=/student&role=student");
  if (!student.onboardedAt) redirect("/onboarding");
  const locale = await getLocale();
  const t = await getMessages(locale);

  return (
    <div className="student-shell">
      <header className="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
        <Link href="/student" aria-label={t.brand}>
          <BrandMark />
        </Link>
        <div className="flex items-center gap-3">
          <LocaleToggle locale={locale} />
          <form action={logoutAccount}>
            <button type="submit" className="text-sm text-ink-soft">
              {t.auth.signOut}
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-lg px-5 pb-12">{children}</div>
    </div>
  );
}
