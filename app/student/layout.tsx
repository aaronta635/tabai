import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { readStudentSession, studioOnboarded } from "@/lib/auth";
import { RETURN_PATH_HEADER, signInPath, studioReturn } from "@/lib/return-path";
import { getLocale, getMessages } from "@/lib/i18n";
import { StudentAppShell } from "@/components/student/app-shell";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await readStudentSession();
  const requested = (await headers()).get(RETURN_PATH_HEADER);
  if (!session) redirect(signInPath("student", requested ?? "/student"));
  if (!(await studioOnboarded(session, "student"))) {
    const back = studioReturn("student", requested);
    redirect(back ? `/onboarding?next=${encodeURIComponent(back)}` : "/onboarding");
  }
  const locale = await getLocale();
  const t = await getMessages(locale);
  return (
    <StudentAppShell
      studentName={session.name}
      labels={{
        home: t.student.navHome,
        classes: t.student.navClasses,
        schedule: t.student.navSchedule,
        work: t.student.navWork,
        takes: t.student.navTakes,
        progress: t.student.navProgress,
        settings: t.student.navSettings,
        profile: t.student.navProfile,
        search: t.studio.search,
        signOut: t.auth.signOut,
        menu: t.student.menu,
        close: t.student.close,
        themeLight: t.theme.light,
        themeDark: t.theme.dark,
        kicker: t.studio.kicker,
      }}
    >
      {children}
    </StudentAppShell>
  );
}
