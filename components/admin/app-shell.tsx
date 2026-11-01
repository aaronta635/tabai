import { logoutAdmin } from "@/app/admin/actions";
import { StudioShell } from "@/components/studio-shell";
import { PARA_SENDER_NAME } from "@/lib/demo-teacher";

type Labels = {
  teachers: string;
  voices: string;
  songs: string;
  submissions: string;
  kicker: string;
  signOut: string;
  menu: string;
  close: string;
  themeLight: string;
  themeDark: string;
};

export function AdminAppShell({ labels, children }: { labels: Labels; children: React.ReactNode }) {
  return (
    <StudioShell
      variant="student"
      name={PARA_SENDER_NAME}
      home="/admin"
      kicker={labels.kicker}
      items={[
        { href: "/admin", icon: "class", label: labels.teachers, exact: true },
        { href: "/admin/voices", icon: "assignment", label: labels.voices },
        { href: "/admin#songs", icon: "progress", label: labels.songs },
        { href: "/admin/submissions", icon: "video", label: labels.submissions },
      ]}
      menuLinks={[]}
      signOutAction={logoutAdmin}
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
