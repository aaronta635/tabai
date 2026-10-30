import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pasteVoiceSamples } from "@/app/admin/actions";
import { getLocale, getMessages } from "@/lib/i18n";
import { StudioTitle } from "@/components/home/feed";
import { VoiceToggle, CurateButton } from "@/components/admin/voice-actions";
import { DEMO_TEACHER_NAME, senderName } from "@/lib/demo-teacher";

export default async function VoicesPage() {
  const ok = await requireAdmin();
  if (!ok) redirect("/admin");
  const locale = await getLocale();
  const t = await getMessages(locale);

  const teachers = await prisma.teacher.findMany({
    where: { name: { not: DEMO_TEACHER_NAME } },
    include: { voiceSamples: { orderBy: { createdAt: "desc" } } },
  });

  const recent = await prisma.reply.findMany({
    where: { source: { in: ["edited_draft", "manual"] } },
    orderBy: { sentAt: "desc" },
    take: 40,
    include: { teacher: true, submission: { include: { piece: true, student: true } } },
  });

  return (
    <div className="space-y-6">
      <StudioTitle title={t.admin.voices} />
      {teachers.map((teacher) => (
        <section key={teacher.id} className="studio-panel space-y-3">
          <h2 className="font-display">{teacher.name}</h2>
          <form action={pasteVoiceSamples} className="space-y-2">
            <input type="hidden" name="teacherId" value={teacher.id} />
            <textarea name="samples" rows={8} placeholder={t.admin.pasteSamples} className="field" />
            <button className="btn" type="submit">
              {t.admin.saveSamples}
            </button>
          </form>
          <ul className="divide-y divide-ink/10">
            {teacher.voiceSamples.map((sample) => (
              <li key={sample.id} className="py-3 text-sm">
                <p className="leading-relaxed">{sample.text}</p>
                <p className="page-meta">
                  {sample.source} {sample.active ? `· ${t.admin.active}` : ""}
                </p>
                <VoiceToggle id={sample.id} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="studio-panel space-y-3">
        <h2 className="font-display">{t.admin.curation}</h2>
        <ul className="divide-y divide-ink/10">
          {recent.map((reply) => (
            <li key={reply.id} className="py-3 text-sm">
              <p className="page-meta">
                {senderName(reply.teacher.name, reply.submission.piece.demo)} · {reply.submission.piece.title} ·{" "}
                {reply.submission.student.name} · {reply.source}
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
