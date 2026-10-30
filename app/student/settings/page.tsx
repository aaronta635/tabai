import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readStudentSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { getTheme } from "@/lib/theme";
import { StudioTitle } from "@/components/home/feed";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitch } from "@/components/locale-switch";
import { ReplayTour } from "@/components/studio/replay-tour";
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
      <section className="studio-panel student-settings-card">
        <h2 className="font-ui">{t.theme.appearance}</h2>
        <ThemeToggle variant="student" theme={theme} labels={{ light: t.theme.light, dark: t.theme.dark }} />
        <div className="student-settings-row">
          <p>{t.theme.language}</p>
          <LocaleSwitch
            labels={{ language: t.theme.language, en: t.locale.en, vi: t.locale.vi }}
          />
        </div>
        <div className="student-settings-row">
          <p>{t.tour.guide}</p>
          <ReplayTour label={t.tour.again} />
        </div>
      </section>
      <form action={deleteStudentAccount} className="studio-panel student-destructive-zone">
        <h2 className="font-ui">{t.student.deleteAccount}</h2>
        <p className="student-delete-copy">{t.student.deleteAccountBody}</p>
        <p className="student-delete-copy">{t.student.deleteAccountKept}</p>
        <label className="student-delete-confirm">
          <input type="checkbox" name="confirm" value="yes" required />
          <span>{t.student.deleteAccountConfirm}</span>
        </label>
        <button type="submit" className="btn btn-quiet text-danger">
          {t.student.deleteAccount}
        </button>
      </form>
    </div>
  );
}
