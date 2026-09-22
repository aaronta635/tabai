import { redirect } from "next/navigation";
import { readStudentSession, studioOnboarded } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { StudentAppShell } from "@/components/student/app-shell";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await readStudentSession();
  if (!session) redirect("/api/session?next=/student&role=student");
  if (!(await studioOnboarded(session, "student"))) redirect("/onboarding");
  const locale = await getLocale();
  const t = await getMessages(locale);

  return (
    <StudentAppShell
      studentName={session.name}
      locale={locale}
      labels={{
        home: t.student.navHome,
        classes: t.student.navClasses,
        schedule: t.student.navSchedule,
        work: t.student.navWork,
        takes: t.student.navTakes,
        progress: t.student.navProgress,
        profile: t.student.navProfile,
        signOut: t.auth.signOut,
        menu: t.student.menu,
        close: t.student.close,
      }}
    >
      {children}
    </StudentAppShell>
  );
}
