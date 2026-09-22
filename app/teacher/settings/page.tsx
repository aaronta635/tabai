import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateDelivery } from "@/app/teacher/actions";
import { getLocale, getMessages } from "@/lib/i18n";
import { MAX_ACTIVE_VOICE_SAMPLES } from "@/lib/constants";
import { SectionPanel } from "@/components/disclosure";

export default async function SettingsPage() {
  const teacher = await requireTeacher();
  if (!teacher) redirect("/");
  const locale = await getLocale();
  const t = await getMessages(locale);
  const samples = await prisma.voiceSample.findMany({
    where: { teacherId: teacher.id, active: true },
    orderBy: { createdAt: "desc" },
    take: MAX_ACTIVE_VOICE_SAMPLES,
  });

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl">{t.teacher.settings}</h1>
      <form action={updateDelivery} className="tile space-y-3">
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
      <SectionPanel title={t.teacher.voices} count={samples.length}>
        <p className="text-sm text-ink-soft">{t.teacher.voicesReadOnly}</p>
        <ul className="mt-3 space-y-2">
          {samples.map((sample) => (
            <li key={sample.id} className="piece-row text-sm leading-relaxed">
              {sample.text}
            </li>
          ))}
        </ul>
      </SectionPanel>
    </div>
  );
}
