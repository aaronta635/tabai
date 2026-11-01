"use client";

import { logoutAccount } from "@/app/onboarding/actions";
import { StudioShell } from "@/components/studio-shell";
import { useStudioMessages } from "@/components/studio/use-studio-messages";

export function StudentAppShell({
  studentName,
  avatarSrc,
  locale,
  children,
}: {
  studentName: string;
  avatarSrc?: string | null;
  locale: "en" | "vi";
  children: React.ReactNode;
}) {
  const t = useStudioMessages(locale);
  return (
    <StudioShell
      variant="student"
      name={studentName}
      avatarSrc={avatarSrc}
      tour={{
        role: "student",
        back: t.tour.back,
        next: t.tour.next,
        close: t.tour.close,
        done: t.tour.done,
        progress: t.tour.progress,
        steps: [
          { href: "/student", title: t.tour.studentHomeTitle, body: t.tour.studentHomeBody },
          {
            href: "student-demo",
            fallback: "/student",
            title: t.tour.studentDemoTitle,
            body: t.tour.studentDemoBody,
          },
          { href: "/student/classes", title: t.tour.studentClassesTitle, body: t.tour.studentClassesBody },
          { href: "/student/schedule", title: t.tour.studentScheduleTitle, body: t.tour.studentScheduleBody },
          { href: "/student/takes", title: t.tour.studentTakesTitle, body: t.tour.studentTakesBody },
          { href: "/student/profile", title: t.tour.studentProfileTitle, body: t.tour.studentProfileBody },
        ],
      }}
      home="/student"
      kicker={t.studio.kicker}
      items={[
        { href: "/student", icon: "home", label: t.student.navHome, exact: true },
        { href: "/student/schedule", icon: "calendar", label: t.student.navSchedule },
        { href: "/student/classes", icon: "class", label: t.student.navClasses },
        { href: "/student/takes", icon: "video", label: t.student.navTakes },
        { href: "/student/progress", icon: "progress", label: t.student.navProgress },
        { href: "/student/settings", icon: "settings", label: t.student.navSettings },
      ]}
      menuLinks={[{ href: "/student/profile", label: t.student.navProfile }]}
      signOutAction={logoutAccount}
      labels={{
        signOut: t.auth.signOut,
        menu: t.student.menu,
        close: t.student.close,
        themeLight: t.theme.light,
        themeDark: t.theme.dark,
        language: t.theme.language,
        localeEn: t.locale.en,
        localeVi: t.locale.vi,
      }}
    >
      {children}
    </StudioShell>
  );
}
