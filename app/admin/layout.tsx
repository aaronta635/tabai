import "@/styles/student/student.css";
import { requireAdmin } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { AdminAppShell } from "@/components/admin/app-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = await getMessages(locale);
  const ok = await requireAdmin();

  if (!ok) {
    return (
      <div className="student-ui studio-shell min-h-dvh">
        <div className="studio-main">{children}</div>
      </div>
    );
  }

  return (
    <AdminAppShell
      labels={{
        teachers: t.admin.teachers,
        voices: t.admin.voices,
        songs: t.admin.demoTitle,
        submissions: t.admin.submissions,
        signOut: t.auth.signOut,
        menu: t.teacher.menu,
        close: t.teacher.close,
        themeLight: t.theme.light,
        themeDark: t.theme.dark,
        kicker: t.studio.kicker,
      }}
    >
      {children}
    </AdminAppShell>
  );
}
