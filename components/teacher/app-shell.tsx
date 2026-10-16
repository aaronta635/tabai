import { logoutTeacher } from "@/app/teacher/actions";
import { StudioShell } from "@/components/studio-shell";

type Labels = {
  general: string;
  classes: string;
  curriculum: string;
  submissions: string;
  roster: string;
  schedule: string;
  settings: string;
  search: string;
  profile: string;
  kicker: string;
  signOut: string;
  menu: string;
  close: string;
  themeLight: string;
  themeDark: string;
};

export function TeacherAppShell({
  teacherName,
  labels,
  children,
}: {
  teacherName: string;
  labels: Labels;
  children: React.ReactNode;
}) {
  return (
    <StudioShell
      name={teacherName}
      home="/teacher"
      kicker={labels.kicker}
      items={[
        { href: "/teacher", label: labels.general, exact: true },
        { href: "/teacher/schedule", label: labels.schedule },
        { href: "/teacher/classes", label: labels.classes },
        { href: "/teacher/curriculum", label: labels.curriculum },
        { href: "/teacher/submissions", label: labels.submissions },
        { href: "/teacher/roster", label: labels.roster },
        { href: "/teacher/settings", label: labels.settings },
      ]}
      menuLinks={[{ href: "/teacher/profile", label: labels.profile }]}
      signOutAction={logoutTeacher}
      search={{ action: "/teacher/search", placeholder: labels.search }}
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
