import Link from "next/link";
import { redirect } from "next/navigation";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appOrigin } from "@/lib/origin";
import { getLocale, getMessages } from "@/lib/i18n";
import { teacherNavCounts } from "@/lib/teacher-stats";
import { CopyLink } from "@/components/teacher/copy-link";

export default async function TeacherDashboard() {
  const teacher = await readTeacherSession();
  if (!teacher) redirect("/auth?next=/teacher");
  const locale = await getLocale();
  const t = await getMessages(locale);
  const origin = await appOrigin();
  const [counts, pieces, profile] = await Promise.all([
    teacherNavCounts(teacher.id),
    prisma.piece.findMany({
      where: { teacherId: teacher.id, archived: false },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { submissions: true } } },
      take: 6,
    }),
    prisma.teacher.findUnique({
      where: { id: teacher.id },
      select: { stage: true },
    }),
  ]);
  const latest = pieces[0];
  const stageCopy =
    profile?.stage === "running"
      ? { title: t.teacher.stageRunning, help: t.teacher.stageRunningHelp }
      : profile?.stage === "collecting"
        ? { title: t.teacher.stageCollecting, help: t.teacher.stageCollectingHelp }
        : profile?.stage === "starting"
          ? { title: t.teacher.stageStarting, help: t.teacher.stageStartingHelp }
          : null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.18em] uppercase text-ink-soft">{t.teacher.navDashboard}</p>
        <h1 className="font-display mt-2 text-3xl">{t.teacher.dashHello.replace("{name}", teacher.name)}</h1>
        {stageCopy ? (
          <p className="mt-3 rounded-2xl bg-cream px-4 py-3 text-sm">
            {stageCopy.title}
            <span className="mt-1 block text-ink-soft">{stageCopy.help}</span>
          </p>
        ) : (
          <p className="mt-2 text-ink-soft">{t.teacher.dashHelp}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/teacher/queue?tab=unanswered" className="lms-card p-4">
          <p className="text-xs tracking-[0.16em] uppercase text-ink-soft">{t.teacher.unanswered}</p>
          <p className="font-display mt-2 text-3xl">{counts.unanswered}</p>
        </Link>
        <Link href="/teacher/queue?tab=pending" className="lms-card p-4">
          <p className="text-xs tracking-[0.16em] uppercase text-ink-soft">{t.teacher.pending}</p>
          <p className="font-display mt-2 text-3xl">{counts.pending}</p>
        </Link>
        <Link href="/teacher/pieces" className="lms-card p-4">
          <p className="text-xs tracking-[0.16em] uppercase text-ink-soft">{t.teacher.navInvite}</p>
          <p className="font-display mt-2 text-3xl">{pieces.length}</p>
        </Link>
      </div>

      {latest ? (
        <section className="lms-card p-5">
          <p className="text-xs tracking-[0.16em] uppercase text-butter">{t.teacher.studentLink}</p>
          <p className="font-display mt-2 text-2xl">{latest.title}</p>
          <p className="mt-3 break-all rounded-xl bg-paper px-3 py-3 text-sm">
            {origin}/l/{latest.code}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <CopyLink url={`${origin}/l/${latest.code}`} />
            <Link
              href="/teacher/pieces"
              className="mt-3 rounded-full bg-beat px-4 py-1.5 text-sm text-white"
            >
              {t.teacher.navInvite}
            </Link>
          </div>
        </section>
      ) : (
        <section className="lms-card p-5">
          <p className="font-display text-xl">{t.teacher.dashEmpty}</p>
          <p className="mt-2 text-ink-soft">{t.teacher.linkHelp}</p>
          <Link
            href="/teacher/pieces"
            className="mt-4 inline-flex rounded-full bg-beat px-4 py-2 text-sm text-white"
          >
            {t.teacher.createPiece}
          </Link>
        </section>
      )}

      {pieces.length > 0 ? (
        <ul className="space-y-3">
          {pieces.map((piece) => (
            <li key={piece.id} className="lms-card p-4">
              <p className="font-display text-lg">{piece.title}</p>
              <p className="mt-1 break-all text-xs text-ink-soft">
                {origin}/l/{piece.code} · {piece._count.submissions}
              </p>
              <CopyLink url={`${origin}/l/${piece.code}`} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
