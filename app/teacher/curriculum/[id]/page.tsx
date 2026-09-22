import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appOrigin } from "@/lib/origin";
import { getLocale, getMessages } from "@/lib/i18n";
import { formatWhen } from "@/lib/when";
import { CopyLink } from "@/components/teacher/copy-link";
import { SectionPanel } from "@/components/disclosure";
import { PieceForm } from "@/components/teacher/piece-form";
import { AssignDialog } from "@/components/teacher/assign-dialog";

export default async function PiecePage({ params }: { params: Promise<{ id: string }> }) {
  const teacher = await readTeacherSession();
  if (!teacher) redirect("/auth?next=/teacher/curriculum");
  const { id } = await params;
  const [piece, classes, students] = await Promise.all([
    prisma.piece.findFirst({
      where: { id, teacherId: teacher.id, archived: false },
      include: {
        part: { select: { name: true } },
        assignments: {
          include: { class: { select: { id: true, name: true } }, student: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.class.findMany({
      where: { teacherId: teacher.id, archived: false },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    prisma.student.findMany({
      where: { teacherId: teacher.id, name: { not: "anonymised" } },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!piece) notFound();
  const locale = await getLocale();
  const t = await getMessages(locale);
  const origin = await appOrigin();
  const studentUrl = `${origin}/l/${piece.code}`;
  const files = [
    piece.sheetMediaId ? t.teacher.hasSheet : null,
    piece.tutorialMediaId ? t.teacher.hasTutorial : null,
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <header>
        <Link href="/teacher/curriculum" className="font-ui text-sm text-ink-soft hover:text-ink">
          ← {t.teacher.navCurriculum}
        </Link>
        <h1 className="font-display mt-3 text-3xl">{piece.title}</h1>
        <p className="font-ui mt-2 text-xs tracking-[0.04em] text-ink-soft">
          {[piece.part?.name, files.length > 0 ? files.join(" · ") : t.teacher.noAttachments]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="code-chip">/l/{piece.code}</span>
          <CopyLink url={studentUrl} />
          <AssignDialog pieceId={piece.id} classes={classes} students={students} />
        </div>
      </header>

      {piece.description || piece.tips ? (
        <section className="tile space-y-3">
          {piece.description ? (
            <div>
              <p className="field-label">{t.teacher.description}</p>
              <p className="mt-1 leading-relaxed">{piece.description}</p>
            </div>
          ) : null}
          {piece.tips ? (
            <div>
              <p className="field-label">{t.teacher.tips}</p>
              <p className="mt-1 leading-relaxed">{piece.tips}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      <SectionPanel title={t.teacher.assignedWork} count={piece.assignments.length}>
        {piece.assignments.length === 0 ? (
          <p className="text-sm text-ink-soft">{t.teacher.assignedEmpty}</p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {piece.assignments.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                {row.class ? (
                  <Link href={`/teacher/classes/${row.class.id}`} className="hover:text-beat">
                    {row.class.name}
                  </Link>
                ) : (
                  <span>{row.student?.name ?? "—"}</span>
                )}
                <span className="font-ui tabular text-xs text-ink-soft">
                  {[row.goal, row.dueAt ? formatWhen(row.dueAt, locale) : null].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionPanel>

      <SectionPanel title={t.teacher.edit}>
        <PieceForm
          pieceId={piece.id}
          partId={piece.partId ?? undefined}
          defaultTitle={piece.title}
          defaultNote={piece.description ?? ""}
          defaultTips={piece.tips ?? ""}
          hasClip={Boolean(piece.clipMediaId)}
        />
      </SectionPanel>
    </div>
  );
}
