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
};

export function TeacherAppShell({
  teacherName,
  locale,
  labels,
  children,
}: {
  teacherName: string;
  locale: string;
  labels: Labels;
  children: React.ReactNode;
}) {
  return (
    <StudioShell
      name={teacherName}
      locale={locale}
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
      labels={{ signOut: labels.signOut, menu: labels.menu, close: labels.close }}
    >
      {children}
    </StudioShell>
  );
}
