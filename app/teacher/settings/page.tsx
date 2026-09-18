import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateDelivery } from "@/app/teacher/actions";
import { getLocale, getMessages } from "@/lib/i18n";
import { MAX_ACTIVE_VOICE_SAMPLES } from "@/lib/constants";

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
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.18em] uppercase text-ink-soft">{t.teacher.settings}</p>
        <h1 className="font-display mt-2 text-3xl">{t.teacher.settings}</h1>
      </div>
      <form action={updateDelivery} className="lms-card space-y-3 p-4">
        <label className="block text-sm">
          {t.teacher.delivery}
          <select
            name="deliveryType"
            defaultValue={teacher.deliveryType ?? ""}
            className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-3 py-3"
          >
            <option value="">—</option>
            <option value="zalo">Zalo</option>
            <option value="messenger">Messenger</option>
          </select>
        </label>
        <label className="block text-sm">
          {t.teacher.handle}
          <input
            name="deliveryHandle"
            defaultValue={teacher.deliveryHandle ?? ""}
            className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-3 py-3"
          />
        </label>
        <button type="submit" className="rounded-xl bg-beat px-4 py-3 text-white">
          OK
        </button>
      </form>
      <section>
        <h2 className="font-display text-xl">{t.teacher.voices}</h2>
        <p className="mt-2 text-sm text-ink-soft">{t.teacher.voicesReadOnly}</p>
        <ul className="mt-4 space-y-3">
          {samples.map((sample) => (
            <li key={sample.id} className="lms-card p-3 text-sm leading-relaxed">
              {sample.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
