import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { formatWhen } from "@/lib/when";
import { StudioTitle } from "@/components/home/feed";

export default async function AdminSubmissionsPage() {
  const ok = await requireAdmin();
  if (!ok) redirect("/admin");
  const locale = await getLocale();
  const t = await getMessages(locale);
  const takes = await prisma.submission.findMany({
    where: { kind: { in: ["take", "overdub"] }, piece: { demo: true, archived: false } },
    orderBy: { submittedAt: "desc" },
    take: 120,
    select: {
      id: true,
      submittedAt: true,
      student: { select: { id: true, name: true } },
      piece: { select: { id: true, title: true } },
      replies: { take: 1, select: { id: true } },
    },
  });

  const songs = new Map<string, { id: string; title: string; students: Map<string, { id: string; name: string; takes: typeof takes }> }>();
  for (const take of takes) {
    const song = songs.get(take.piece.id) ?? { id: take.piece.id, title: take.piece.title, students: new Map() };
    const student = song.students.get(take.student.id) ?? { id: take.student.id, name: take.student.name, takes: [] };
    student.takes.push(take);
    song.students.set(take.student.id, student);
    songs.set(take.piece.id, song);
  }

  return (
    <div className="space-y-6">
      <StudioTitle title={t.admin.submissionsTitle} meta={t.admin.submissionsHelp} />
      {songs.size === 0 ? <p className="text-ink-soft">{t.admin.submissionsEmpty}</p> : null}
      {[...songs.values()].map((song) => (
        <section key={song.id} className="studio-panel space-y-4">
          <h2 className="font-display">{song.title}</h2>
          {[...song.students.values()]
            .sort((a, b) => a.name.localeCompare(b.name, locale))
            .map((student) => (
              <div key={student.id}>
                <h3 className="font-display text-base">{student.name}</h3>
                <ul className="divide-y divide-ink/10">
                  {student.takes.map((take) => (
                    <li key={take.id}>
                      <Link href={`/admin/submissions/${take.id}`} className="flex items-center justify-between gap-3 py-3">
                        <span className="page-meta">{formatWhen(take.submittedAt, locale)}</span>
                        <span className="status-chip">
                          {take.replies.length > 0 ? t.admin.letterSent : t.admin.letterWaiting}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </section>
      ))}
    </div>
  );
}
