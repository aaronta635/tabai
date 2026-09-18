import { redirect } from "next/navigation";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { TeacherAppShell } from "@/components/teacher/app-shell";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await readTeacherSession();
  if (!session) redirect("/api/session?next=/teacher&role=tutor");
  const teacher = await prisma.teacher.findUnique({
    where: { id: session.id },
    select: { name: true, onboardedAt: true },
  });
  if (!teacher) redirect("/auth?role=tutor");
  if (!teacher.onboardedAt) redirect("/onboarding");
  const locale = await getLocale();
  const t = await getMessages(locale);

  return (
    <TeacherAppShell
      teacherName={teacher.name}
      locale={locale}
      labels={{
        dashboard: t.teacher.navDashboard,
        invite: t.teacher.navInvite,
        queue: t.teacher.navQueue,
        settings: t.teacher.settings,
        signOut: t.auth.signOut,
        menu: t.teacher.menu,
        close: t.teacher.close,
      }}
    >
      {children}
    </TeacherAppShell>
  );
}
