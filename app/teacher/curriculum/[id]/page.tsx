import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appOrigin } from "@/lib/origin";
import { getLocale, getMessages } from "@/lib/i18n";
import { formatWhen } from "@/lib/when";
import { CopyLink } from "@/components/teacher/copy-link";
import { SectionPanel } from "@/components/disclosure";
import { PieceForm } from "@/components/teacher/piece-form";
import { AssignDialog } from "@/components/teacher/assign-dialog";
import { PieceModelPanel } from "@/components/teacher/piece-model-panel";
import { PieceMedia } from "@/components/student/piece-media";
import { mediaStoragePath, sheetView, signedMediaUrl } from "@/lib/media-view";
import { parseSheetSync } from "@/lib/score-model";

export default async function PiecePage({ params }: { params: Promise<{ id: string }> }) {
  const teacher = await readTeacherSession();
  if (!teacher) redirect(signInPath("tutor", "/teacher"));
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
        models: { orderBy: { version: "desc" }, take: 1 },
        sheetMedia: { select: { storagePath: true } },
        tutorialMedia: { select: { storagePath: true } },
        clipMedia: { select: { storagePath: true } },
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
  const tutorialPath = mediaStoragePath(piece.tutorialMedia);
  const sheetPath = mediaStoragePath(piece.sheetMedia);
  const clipPath = mediaStoragePath(piece.clipMedia);
  const [tutorialUrl, sheetUrl, clipUrl, readyModel] = await Promise.all([
    signedMediaUrl(tutorialPath),
    signedMediaUrl(sheetPath),
    signedMediaUrl(clipPath),
    prisma.pieceModel.findFirst({
      where: { pieceId: piece.id, status: "ready" },
      orderBy: { version: "desc" },
      select: { sheetSyncJson: true },
    }),
  ]);
  const files = [
    piece.sheetMediaId ? t.teacher.hasSheet : null,
    piece.tutorialMediaId ? t.teacher.hasTutorial : null,
  ].filter(Boolean);

  return (
    <div className="teacher-piece space-y-5">
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
          <CopyLink url={studentUrl} copy={t.teacher.copyLink} copied={t.teacher.linkCopied} />
          <AssignDialog pieceId={piece.id} classes={classes} students={students} />
        </div>
      </header>

      <PieceModelPanel
        model={piece.models[0] ?? null}
        hasSheet={Boolean(piece.sheetMediaId)}
        hasTutorial={Boolean(piece.tutorialMediaId)}
        locale={locale}
        copy={{
          title: t.teacher.pieceModel,
          ready: t.teacher.modelReady,
          training: t.teacher.modelTraining,
          failed: t.teacher.modelFailed,
          needAssets: t.teacher.modelNeedAssets,
          none: t.teacher.modelNone,
          chords: t.teacher.modelChords,
          noChords: t.teacher.modelNoChords,
          cues: t.teacher.modelCues,
          fromTutorial: t.teacher.hasTutorial,
          fromSheet: t.teacher.hasSheet,
          raw: t.teacher.modelRaw,
          help: t.teacher.modelHelp,
          tutorialNotes: t.teacher.tutorialNotes,
          heardNotesNone: t.teacher.heardNotesNone,
          heardNotesError: t.teacher.heardNotesError,
        }}
      />

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

      <PieceMedia
        tutorialUrl={tutorialUrl}
        clipUrl={clipUrl}
        sheetUrl={sheetUrl}
        sheetKind={sheetView(sheetPath ?? "")}
        sheetSync={parseSheetSync(readyModel?.sheetSyncJson)}
        labels={{
          reference: t.teacher.tutorialLabel,
          clip: t.teacher.clipLabel,
          sheet: t.teacher.sheetLabel,
          openSheet: t.teacher.hasSheet,
        }}
      />

      <section className="tile piece-edit">
        <h2 className="font-display text-xl">{t.teacher.edit}</h2>
        <p className="mt-1 text-sm text-ink-soft">{t.teacher.replaceHint}</p>
        <div className="mt-4">
          <PieceForm
            pieceId={piece.id}
            partId={piece.partId ?? undefined}
            defaultTitle={piece.title}
            defaultNote={piece.description ?? ""}
            defaultTips={piece.tips ?? ""}
            hasSheet={Boolean(sheetUrl)}
            hasTutorial={Boolean(tutorialUrl)}
            hasClip={Boolean(clipUrl)}
          />
        </div>
      </section>
    </div>
  );
}
