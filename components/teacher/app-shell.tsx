import { logoutTeacher } from "@/app/teacher/actions";
import { StudioShell } from "@/components/studio-shell";

type Labels = {
  general: string;
  classes: string;
  curriculum: string;
  submissions: string;
  schedule: string;
  settings: string;
  profile: string;
  signOut: string;
  menu: string;
  close: string;
  themeLight: string;
  themeDark: string;
};

export function TeacherAppShell({
  teacherName,
  locale,
  theme,
  labels,
  children,
}: {
  teacherName: string;
  locale: string;
  theme: "light" | "dark";
  labels: Labels;
  children: React.ReactNode;
}) {
  return (
    <StudioShell
      name={teacherName}
      locale={locale}
      theme={theme}
      home="/teacher"
      items={[
        { href: "/teacher", label: labels.general, exact: true },
        { href: "/teacher/classes", label: labels.classes },
        { href: "/teacher/curriculum", label: labels.curriculum },
        { href: "/teacher/submissions", label: labels.submissions, countsUrl: "/api/teacher/counts" },
        { href: "/teacher/schedule", label: labels.schedule },
      ]}
      menuLinks={[
        { href: "/teacher/profile", label: labels.profile },
        { href: "/teacher/settings", label: labels.settings },
      ]}
      signOutAction={logoutTeacher}
      labels={{
        signOut: labels.signOut,
        menu: labels.menu,
        close: labels.close,
        themeLight: labels.themeLight,
        themeDark: labels.themeDark,
      }}
    >
      {children}
    </StudioShell>
  );
}
