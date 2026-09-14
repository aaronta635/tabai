import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pasteVoiceSamples } from "@/app/admin/actions";
import { getLocale, getMessages } from "@/lib/i18n";
import { VoiceToggle, CurateButton } from "@/components/admin/voice-actions";

export default async function VoicesPage() {
  const ok = await requireAdmin();
  if (!ok) redirect("/admin");
  const locale = await getLocale();
  const t = await getMessages(locale);

  const teachers = await prisma.teacher.findMany({
    include: { voiceSamples: { orderBy: { createdAt: "desc" } } },
  });

  const recent = await prisma.reply.findMany({
    where: { source: { in: ["edited_draft", "manual"] } },
    orderBy: { sentAt: "desc" },
    take: 40,
    include: { teacher: true, submission: { include: { piece: true, student: true } } },
  });

  return (
    <div className="space-y-10">
      <h1 className="font-display text-3xl">{t.admin.voices}</h1>
      {teachers.map((teacher) => (
        <section key={teacher.id} className="space-y-3">
          <h2 className="font-display text-xl">{teacher.name}</h2>
          <form action={pasteVoiceSamples} className="space-y-2 rounded-2xl bg-night-card p-4">
            <input type="hidden" name="teacherId" value={teacher.id} />
            <textarea
              name="samples"
              rows={8}
              placeholder={t.admin.pasteSamples}
              className="w-full rounded-xl bg-night p-3"
            />
            <button className="rounded-xl bg-forest px-4 py-3 text-white" type="submit">
              {t.admin.saveSamples}
            </button>
          </form>
          <ul className="space-y-2">
            {teacher.voiceSamples.map((sample) => (
              <li key={sample.id} className="rounded-xl bg-night-card p-3 text-sm">
                <p className="leading-relaxed">{sample.text}</p>
                <p className="mt-2 text-xs text-bone/40">
                  {sample.source} {sample.active ? `· ${t.admin.active}` : ""}
                </p>
                <VoiceToggle id={sample.id} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section>
        <h2 className="font-display text-xl">Curation</h2>
        <ul className="mt-3 space-y-3">
          {recent.map((reply) => (
            <li key={reply.id} className="rounded-2xl bg-night-card p-4 text-sm">
              <p className="text-xs text-bone/50">
                {reply.teacher.name} · {reply.submission.piece.title} · {reply.submission.student.name} ·{" "}
                {reply.source}
              </p>
              <p className="mt-2 leading-relaxed">{reply.text}</p>
              <CurateButton id={reply.id} label={t.admin.curate} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
