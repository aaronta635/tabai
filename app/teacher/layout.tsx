import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { readTeacherSession, studioOnboarded } from "@/lib/auth";
import { RETURN_PATH_HEADER, signInPath, studioReturn } from "@/lib/return-path";
import { getLocale, getMessages } from "@/lib/i18n";
import { TeacherAppShell } from "@/components/teacher/app-shell";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await readTeacherSession();
  const requested = (await headers()).get(RETURN_PATH_HEADER);
  if (!session) redirect(signInPath("tutor", requested ?? "/teacher"));
  if (!(await studioOnboarded(session, "teacher"))) {
    const back = studioReturn("tutor", requested);
    redirect(back ? `/onboarding?next=${encodeURIComponent(back)}` : "/onboarding");
  }
  const locale = await getLocale();
  const t = await getMessages(locale);
  return (
    <TeacherAppShell
      teacherName={session.name}
      labels={{
        general: t.teacher.navGeneral,
        classes: t.teacher.navClasses,
        curriculum: t.teacher.navCurriculum,
        submissions: t.teacher.navSubmissions,
        roster: t.teacher.navRoster,
        schedule: t.teacher.navSchedule,
        search: t.studio.search,
        settings: t.teacher.settings,
        profile: t.teacher.navProfile,
        signOut: t.auth.signOut,
        menu: t.teacher.menu,
        close: t.teacher.close,
        themeLight: t.theme.light,
        themeDark: t.theme.dark,
        kicker: t.studio.kicker,
      }}
    >
      {children}
    </TeacherAppShell>
  );
}
