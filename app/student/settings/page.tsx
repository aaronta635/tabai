import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readStudentSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { getTheme } from "@/lib/theme";
import { StudioTitle } from "@/components/home/feed";
import { ThemeToggle } from "@/components/theme-toggle";
import { deleteStudentAccount } from "@/app/account/actions";

export default async function StudentSettingsPage() {
  const student = await readStudentSession();
  if (!student) redirect(signInPath("student", "/student"));
  const locale = await getLocale();
  const theme = await getTheme();
  const t = await getMessages(locale);

  return (
    <div className="student-settings space-y-6">
      <StudioTitle title={t.student.settingsTitle} />
      <section className="studio-panel space-y-4 pb-4">
        <h2 className="font-ui">{t.theme.appearance}</h2>
        <ThemeToggle variant="student" theme={theme} labels={{ light: t.theme.light, dark: t.theme.dark }} />
      </section>
      <form action={deleteStudentAccount} className="studio-panel student-destructive-zone space-y-3 pb-4">
        <h2 className="font-ui">{t.student.deleteAccount}</h2>
        <p className="text-sm leading-relaxed">{t.student.deleteAccountBody}</p>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="confirm" value="yes" required className="mt-1" />
          <span>{t.student.deleteAccountConfirm}</span>
        </label>
        <button type="submit" className="btn btn-quiet text-danger">
          {t.student.deleteAccount}
        </button>
      </form>
    </div>
  );
}
