import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { LocaleToggle } from "@/components/locale-toggle";
import { Strings } from "@/components/strings";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = await getMessages(locale);
  const ok = await requireAdmin();

  return (
    <div className="teacher-shell">
      <header className="border-b border-night-line px-4 py-3">
        <Strings className="mb-3 text-bone" />
        <div className="flex items-center justify-between">
          <p className="font-display text-lg">Admin</p>
          <LocaleToggle locale={locale} />
        </div>
        {ok ? (
          <nav className="mt-3 flex gap-4 text-sm">
            <Link href="/admin">{t.admin.teachers}</Link>
            <Link href="/admin/voices">{t.admin.voices}</Link>
          </nav>
        ) : null}
      </header>
      <div className="mx-auto max-w-3xl px-4 py-6">{children}</div>
    </div>
  );
}
