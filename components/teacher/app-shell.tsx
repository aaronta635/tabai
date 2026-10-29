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
      variant="teacher"
      name={teacherName}
      home="/teacher"
      kicker={labels.kicker}
      items={[
        { href: "/teacher", icon: "home", label: labels.general, exact: true },
        { href: "/teacher/schedule", icon: "calendar", label: labels.schedule },
        { href: "/teacher/classes", icon: "class", label: labels.classes },
        { href: "/teacher/curriculum", icon: "assignment", label: labels.curriculum },
        { href: "/teacher/submissions", icon: "video", label: labels.submissions },
        { href: "/teacher/roster", icon: "class", label: labels.roster },
        { href: "/teacher/settings", icon: "settings", label: labels.settings },
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
