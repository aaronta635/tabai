import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { nudgeHref } from "@/lib/deep-links";
import { heardExtractFromMetrics, observationMarkers, observationPositives, parseCompareObservations } from "@/lib/score-model";
import { QueueClient } from "@/components/teacher/queue-client";
import { CompareFactsPanel } from "@/components/teacher/compare-facts-panel";
import { ModelCompareDesk } from "@/components/teacher/model-compare-desk";

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const teacher = await readTeacherSession();
  if (!teacher) redirect(signInPath("tutor", "/teacher"));
  const { id } = await params;
  const row = await prisma.submission.findFirst({
    where: { id, piece: { teacherId: teacher.id } },
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
  const kind = !row.student.approvedAt
    ? ("pending" as const)
    : row.status === "answered"
      ? ("answered" as const)
      : row.kind === "practice"
        ? ("practice" as const)
        : ("unanswered" as const);

  return (
    <div>
      <Link href="/teacher/submissions" className="text-sm text-ink-soft">
        ← {t.teacher.navSubmissions}
      </Link>
      <h1 className="font-display mt-2 text-3xl">{row.student.name}</h1>
      <QueueClient
        hideTabs
        tab={kind === "practice" ? "practice" : kind}
        labels={{
          unanswered: t.teacher.unanswered,
          pending: t.teacher.pending,
          answered: t.teacher.answered,
          practice: t.teacher.practice,
        }}
        counts={{
          unanswered: kind === "unanswered" ? 1 : 0,
          pending: kind === "pending" ? 1 : 0,
          answered: kind === "answered" ? 1 : 0,
          practice: kind === "practice" ? 1 : 0,
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
          pieceHref={`/teacher/curriculum/${row.piece.id}`}
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
