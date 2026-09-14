import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { LocaleToggle } from "@/components/locale-toggle";
import { getLocale, getMessages } from "@/lib/i18n";
import { logoutTeacher } from "@/app/teacher/actions";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const teacher = await requireTeacher();
  if (!teacher) redirect("/auth?next=/teacher/pieces");
  const locale = await getLocale();
  const t = await getMessages(locale);

  return (
    <div className="teacher-shell">
      <header className="border-b border-night-line px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-lg">{teacher.name}</p>
          <LocaleToggle locale={locale} />
        </div>
        <nav className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href="/teacher/pieces">{t.teacher.linkTitle}</Link>
          <Link href="/teacher/queue">{t.teacher.queue}</Link>
          <Link href="/teacher/settings">{t.teacher.settings}</Link>
          <form action={logoutTeacher}>
            <button type="submit" className="text-bone/60">
              {t.auth.signOut}
            </button>
          </form>
        </nav>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-6">{children}</div>
    </div>
  );
}
