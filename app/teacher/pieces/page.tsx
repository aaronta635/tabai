import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appOrigin } from "@/lib/origin";
import { createPiece } from "@/app/teacher/actions";
import { getLocale, getMessages } from "@/lib/i18n";
import { CopyLink } from "@/components/teacher/copy-link";

export default async function PiecesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const teacher = await requireTeacher();
  if (!teacher) redirect("/auth?next=/teacher/pieces");
  const locale = await getLocale();
  const t = await getMessages(locale);
  const { created } = await searchParams;
  const origin = await appOrigin();
  const pieces = await prisma.piece.findMany({
    where: { teacherId: teacher.id, archived: false },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });
  const newest = created ? pieces.find((p) => p.code === created) : pieces[0];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.2em] uppercase text-bone/50">{t.teacher.demoHere}</p>
        <h1 className="font-display mt-2 text-3xl">{t.teacher.linkTitle}</h1>
        <p className="mt-2 text-bone/70">{t.teacher.linkHelp}</p>
      </div>

      <form action={createPiece} className="space-y-3 rounded-2xl bg-night-card p-4">
        <input
          required
          name="title"
          placeholder={t.teacher.title}
          className="w-full rounded-xl bg-night px-3 py-3"
        />
        <textarea
          name="note"
          placeholder={t.teacher.note}
          rows={2}
          className="w-full rounded-xl bg-night px-3 py-3"
        />
        <button type="submit" className="w-full rounded-xl bg-forest px-4 py-3 text-white">
          {t.teacher.createPiece}
        </button>
      </form>

      {newest ? (
        <div className="rounded-2xl border border-brass/40 bg-night-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-brass">{t.teacher.studentLink}</p>
          <p className="font-display mt-2 text-2xl">{newest.title}</p>
          <p className="mt-3 break-all rounded-xl bg-night px-3 py-3 text-sm">
            {origin}/l/{newest.code}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyLink url={`${origin}/l/${newest.code}`} />
            <Link
              href={`/l/${newest.code}`}
              className="mt-3 rounded-full border border-bone/20 px-3 py-1 text-sm"
            >
              {t.teacher.openStudent}
            </Link>
          </div>
        </div>
      ) : null}

      <ul className="space-y-4">
        {pieces.map((piece) => (
          <li key={piece.id} className="rounded-2xl bg-night-card p-4">
            <p className="font-display text-xl">{piece.title}</p>
            {piece.note ? <p className="mt-1 text-sm text-bone/70">{piece.note}</p> : null}
            <p className="mt-2 break-all text-xs text-bone/50">
              {origin}/l/{piece.code} · {piece._count.submissions} · {t.teacher.postLine}
            </p>
            <CopyLink url={`${origin}/l/${piece.code}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
