import { logoutAccount } from "@/app/onboarding/actions";
import { StudioShell } from "@/components/studio-shell";

type Labels = {
  home: string;
  classes: string;
  schedule: string;
  work: string;
  takes: string;
  progress: string;
  settings: string;
  profile: string;
  search: string;
  kicker: string;
  signOut: string;
  menu: string;
  close: string;
  themeLight: string;
  themeDark: string;
};

export function StudentAppShell({
  studentName,
  labels,
  children,
}: {
  studentName: string;
  labels: Labels;
  children: React.ReactNode;
}) {
  return (
    <StudioShell
      name={studentName}
      home="/student"
      kicker={labels.kicker}
      items={[
        { href: "/student", label: labels.home, exact: true },
        { href: "/student/schedule", label: labels.schedule },
        { href: "/student/classes", label: labels.classes },
        { href: "/student/work", label: labels.work },
        { href: "/student/takes", label: labels.takes },
        { href: "/student/progress", label: labels.progress },
        { href: "/student/settings", label: labels.settings },
      ]}
      menuLinks={[{ href: "/student/profile", label: labels.profile }]}
      signOutAction={logoutAccount}
      search={{ action: "/student/search", placeholder: labels.search }}
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
