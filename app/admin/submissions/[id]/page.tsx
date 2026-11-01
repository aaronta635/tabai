import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { nudgeHref } from "@/lib/deep-links";
import { heardExtractFromMetrics, observationMarkers, observationPositives, parseCompareObservations } from "@/lib/score-model";
import { StudioTitle } from "@/components/home/feed";
import { QueueClient } from "@/components/teacher/queue-client";
import { CompareFactsPanel } from "@/components/teacher/compare-facts-panel";
import { ModelCompareDesk } from "@/components/teacher/model-compare-desk";

export default async function AdminSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const ok = await requireAdmin();
  if (!ok) redirect("/admin");
  const { id } = await params;
  const row = await prisma.submission.findFirst({
    where: { id, kind: { in: ["take", "overdub"] }, piece: { demo: true } },
    include: {
      student: true,
      piece: { include: { models: { where: { status: "ready" }, orderBy: { version: "desc" }, take: 1 } } },
      drafts: { orderBy: { createdAt: "desc" }, take: 1 },
      replies: { orderBy: { createdAt: "desc" }, take: 1 },
      analyses: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!row) notFound();
  const locale = await getLocale();
  const t = await getMessages(locale);
  const kind = row.status === "answered" ? ("answered" as const) : ("unanswered" as const);

  return (
    <div>
      <Link href="/admin/submissions" className="text-sm text-ink-soft">
        ← {t.admin.submissions}
      </Link>
      <StudioTitle title={row.student.name} meta={row.piece.title} />
      <QueueClient
        hideTabs
        tab={kind}
        labels={{
          unanswered: t.teacher.unanswered,
          pending: t.teacher.pending,
          answered: t.teacher.answered,
          practice: t.teacher.practice,
        }}
        counts={{
          unanswered: kind === "unanswered" ? 1 : 0,
          pending: 0,
          answered: kind === "answered" ? 1 : 0,
          practice: 0,
        }}
        items={[
          {
            id: row.id,
            kind,
            studentId: row.studentId,
            studentName: row.student.name,
            pieceTitle: row.piece.title,
            waitingMs: Date.now() - row.submittedAt.getTime(),
            mediaId: row.mediaId,
            draft: row.drafts[0]?.text ?? null,
            draftAt: row.drafts[0]?.createdAt.toISOString() ?? null,
            reply: row.replies[0]?.text ?? null,
            teacherPick: row.teacherPick,
            skipReason: row.skipReason,
            nudgeUrl: nudgeHref(row.student.contactType, row.student.contactHandle),
            submissionId: row.id,
            markers: observationMarkers(row.analyses[0]?.observationsJson),
            positives: observationPositives(row.analyses[0]?.observationsJson),
            pitchJudge: parseCompareObservations(row.analyses[0]?.observationsJson).pitchJudge,
            submissionKind: row.kind,
            studentNote: row.studentNote,
          },
        ]}
      />
      <div className="mt-5 space-y-4">
        <ModelCompareDesk
          pieceModel={row.piece.models[0] ?? null}
          heardJson={heardExtractFromMetrics(row.analyses[0]?.metricsJson)}
          metricsJson={row.analyses[0]?.metricsJson}
          copy={{
            title: t.teacher.modelDesk,
            piece: t.teacher.pieceModel,
            take: t.teacher.takeModel,
            emptyPiece: t.teacher.modelNone,
            emptyTake: t.teacher.takeModelNone,
            chords: t.teacher.modelChords,
            takeChords: t.teacher.takeChords,
            cues: t.teacher.modelCues,
            takeCues: t.teacher.takeCues,
            raw: t.teacher.modelRaw,
            onlyPiece: t.teacher.chordsOnlyPiece,
            onlyTake: t.teacher.chordsOnlyTake,
            help: t.teacher.modelDeskHelp,
            heardNotes: t.teacher.heardNotes,
            tutorialNotes: t.teacher.tutorialNotes,
            heardNotesNone: t.teacher.heardNotesNone,
            heardNotesError: t.teacher.heardNotesError,
          }}
        />
        <CompareFactsPanel
          observations={row.analyses[0]?.observationsJson}
          pieceHref="/admin#songs"
          copy={{
            title: t.teacher.compareFacts,
            none: t.teacher.compareNone,
            expected: t.teacher.compareExpected,
            observed: t.teacher.compareObserved,
            next: t.teacher.compareNext,
            openModel: t.teacher.openPieceModel,
          }}
        />
      </div>
    </div>
  );
}
