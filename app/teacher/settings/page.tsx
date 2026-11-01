import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addVoiceSamples, retireVoice, updateDelivery } from "@/app/teacher/actions";
import { getLocale, getMessages } from "@/lib/i18n";
import { getTheme } from "@/lib/theme";
import { MAX_ACTIVE_VOICE_SAMPLES } from "@/lib/constants";
import { StudioTitle } from "@/components/home/feed";
import { SectionPanel } from "@/components/disclosure";
import { ThemeToggle } from "@/components/theme-toggle";
import { ReplayTour } from "@/components/studio/replay-tour";
import { deleteTeacherAccountAction } from "@/app/account/actions";

export default async function SettingsPage() {
  const teacher = await requireTeacher();
  if (!teacher) redirect(signInPath("tutor", "/teacher"));
  const locale = await getLocale();
  const theme = await getTheme();
  const t = await getMessages(locale);
  const samples = await prisma.voiceSample.findMany({
    where: { teacherId: teacher.id, active: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="teacher-settings space-y-5">
      <StudioTitle title={t.teacher.settings} />
      <section className="studio-panel space-y-4 pb-4">
        <h2>{t.theme.appearance}</h2>
        <ThemeToggle variant="student" theme={theme} labels={{ light: t.theme.light, dark: t.theme.dark }} />
        <ReplayTour label={t.tour.again} />
      </section>
      <form action={deleteTeacherAccountAction} className="teacher-danger studio-panel space-y-3 pb-4">
        <h2>{t.teacher.deleteAccount}</h2>
        <p className="text-sm leading-relaxed">{t.teacher.deleteAccountBody}</p>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="confirm" value="yes" required className="mt-1" />
          <span>{t.teacher.deleteAccountConfirm}</span>
        </label>
        <button type="submit" className="btn">
          {t.teacher.deleteAccount}
        </button>
      </form>
      <form action={updateDelivery} className="studio-panel space-y-3 pb-4">
        <label className="block">
          <span className="field-label">{t.teacher.delivery}</span>
          <select name="deliveryType" defaultValue={teacher.deliveryType ?? ""} className="field mt-1.5">
            <option value="">—</option>
            <option value="zalo">Zalo</option>
            <option value="messenger">Messenger</option>
          </select>
        </label>
        <label className="block">
          <span className="field-label">{t.teacher.handle}</span>
          <input name="deliveryHandle" defaultValue={teacher.deliveryHandle ?? ""} className="field mt-1.5" />
        </label>
        <button type="submit" className="btn">
          OK
        </button>
      </form>
      <SectionPanel title={t.teacher.voices} count={samples.length} open>
        <form action={addVoiceSamples} className="space-y-2">
          <p className="text-sm text-ink-soft">
            {t.teacher.voicesHint.replace("{n}", String(MAX_ACTIVE_VOICE_SAMPLES))}
          </p>
          <textarea name="samples" rows={4} className="field" placeholder={t.teacher.voicesAdd} />
          <button type="submit" className="btn">
            {t.teacher.voicesAdd}
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {samples.map((sample) => (
            <li key={sample.id} className="piece-row flex items-start justify-between gap-3 text-sm leading-relaxed">
              <span>{sample.text}</span>
              <form action={retireVoice}>
                <input type="hidden" name="id" value={sample.id} />
                <button type="submit" className="btn-quiet shrink-0">
                  {t.teacher.voicesRetire}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </SectionPanel>
    </div>
  );
}
