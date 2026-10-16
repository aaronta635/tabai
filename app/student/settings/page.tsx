import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readStudentSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { getTheme } from "@/lib/theme";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function StudentSettingsPage() {
  const student = await readStudentSession();
  if (!student) redirect(signInPath("student", "/student"));
  const locale = await getLocale();
  const theme = await getTheme();
  const t = await getMessages(locale);

  return (
    <div className="space-y-5">
      <h1 className="font-display">{t.student.settingsTitle}</h1>
      <section className="studio-panel space-y-4 pb-4">
        <h2>{t.theme.appearance}</h2>
        <ThemeToggle theme={theme} labels={{ light: t.theme.light, dark: t.theme.dark }} />
        <div>
          <p className="field-label">{t.theme.language}</p>
          <div className="mt-1.5">
            <LocaleToggle locale={locale} />
          </div>
        </div>
      </section>
    </div>
  );
}
