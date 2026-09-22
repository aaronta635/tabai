import { logoutAccount } from "@/app/onboarding/actions";
import { StudioShell } from "@/components/studio-shell";

type Labels = {
  home: string;
  classes: string;
  schedule: string;
  work: string;
  takes: string;
  progress: string;
  profile: string;
  signOut: string;
  menu: string;
  close: string;
};

export function StudentAppShell({
  studentName,
  locale,
  labels,
  children,
}: {
  studentName: string;
  locale: string;
  labels: Labels;
  children: React.ReactNode;
}) {
  return (
    <StudioShell
      name={studentName}
      locale={locale}
      home="/student"
      items={[
        { href: "/student", label: labels.home, exact: true },
        { href: "/student/classes", label: labels.classes },
        { href: "/student/schedule", label: labels.schedule },
        { href: "/student/work", label: labels.work },
        { href: "/student/takes", label: labels.takes, countsUrl: "/api/student/counts" },
        { href: "/student/progress", label: labels.progress },
      ]}
      menuLinks={[{ href: "/student/profile", label: labels.profile }]}
      signOutAction={logoutAccount}
      labels={{ signOut: labels.signOut, menu: labels.menu, close: labels.close }}
    >
      {children}
    </StudioShell>
  );
}
