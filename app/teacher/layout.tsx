import { redirect } from "next/navigation";
import { readTeacherSession, studioOnboarded } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { getTheme } from "@/lib/theme";
import { TeacherAppShell } from "@/components/teacher/app-shell";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await readTeacherSession();
  if (!session) redirect("/api/session?next=/teacher&role=tutor");
  if (!(await studioOnboarded(session, "teacher"))) redirect("/onboarding");
  const locale = await getLocale();
  const theme = await getTheme();
  const t = await getMessages(locale);

  return (
    <TeacherAppShell
      teacherName={session.name}
      locale={locale}
      theme={theme}
      labels={{
        general: t.teacher.navGeneral,
        classes: t.teacher.navClasses,
        curriculum: t.teacher.navCurriculum,
        submissions: t.teacher.navSubmissions,
        schedule: t.teacher.navSchedule,
        settings: t.teacher.settings,
        profile: t.teacher.navProfile,
        signOut: t.auth.signOut,
        menu: t.teacher.menu,
        close: t.teacher.close,
        themeLight: t.theme.light,
        themeDark: t.theme.dark,
      }}
    >
      {children}
    </TeacherAppShell>
  );
}
