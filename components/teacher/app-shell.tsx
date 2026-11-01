"use client";

import { logoutTeacher } from "@/app/teacher/actions";
import { StudioShell } from "@/components/studio-shell";
import { useStudioMessages } from "@/components/studio/use-studio-messages";

export function TeacherAppShell({
  teacherName,
  avatarSrc,
  locale,
  children,
}: {
  teacherName: string;
  avatarSrc?: string | null;
  locale: "en" | "vi";
  children: React.ReactNode;
}) {
  const t = useStudioMessages(locale);
  return (
    <StudioShell
      variant="teacher"
      name={teacherName}
      avatarSrc={avatarSrc}
      tour={{
        role: "teacher",
        back: t.tour.back,
        next: t.tour.next,
        close: t.tour.close,
        done: t.tour.done,
        progress: t.tour.progress,
        steps: [
          { href: "/teacher", title: t.tour.teacherHomeTitle, body: t.tour.teacherHomeBody },
          { href: "/teacher/classes", title: t.tour.teacherClassesTitle, body: t.tour.teacherClassesBody },
          { href: "/teacher/curriculum", title: t.tour.teacherCurriculumTitle, body: t.tour.teacherCurriculumBody },
          { href: "/teacher/submissions", title: t.tour.teacherSubmissionsTitle, body: t.tour.teacherSubmissionsBody },
          { href: "/teacher/schedule", title: t.tour.teacherScheduleTitle, body: t.tour.teacherScheduleBody },
        ],
      }}
      home="/teacher"
      kicker={t.studio.kicker}
      items={[
        { href: "/teacher", icon: "home", label: t.teacher.navGeneral, exact: true },
        { href: "/teacher/schedule", icon: "calendar", label: t.teacher.navSchedule },
        { href: "/teacher/classes", icon: "class", label: t.teacher.navClasses },
        { href: "/teacher/curriculum", icon: "assignment", label: t.teacher.navCurriculum },
        { href: "/teacher/submissions", icon: "video", label: t.teacher.navSubmissions },
        { href: "/teacher/roster", icon: "progress", label: t.teacher.navRoster },
        { href: "/teacher/settings", icon: "settings", label: t.teacher.settings },
      ]}
      search={{ action: "/teacher/search", placeholder: t.studio.search }}
      menuLinks={[{ href: "/teacher/profile", label: t.teacher.navProfile }]}
      signOutAction={logoutTeacher}
      labels={{
        signOut: t.auth.signOut,
        menu: t.teacher.menu,
        close: t.teacher.close,
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
