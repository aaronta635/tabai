import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { nudgeHref } from "@/lib/deep-links";
import { observationMarkers } from "@/lib/score-model";
import { QueueClient } from "@/components/teacher/queue-client";

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const teacher = await readTeacherSession();
  if (!teacher) redirect("/auth?next=/teacher/submissions");
  const { id } = await params;
  const row = await prisma.submission.findFirst({
    where: { id, piece: { teacherId: teacher.id } },
    include: {
      student: true,
      piece: true,
      drafts: { orderBy: { createdAt: "desc" }, take: 1 },
      replies: { orderBy: { createdAt: "desc" }, take: 1 },
      analyses: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!row) notFound();
  const locale = await getLocale();
  const t = await getMessages(locale);
  const kind =
    row.status === "answered" ? ("answered" as const) : row.kind === "practice" ? ("practice" as const) : ("unanswered" as const);

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
        counts={{ unanswered: 1, pending: 0, answered: 0, practice: 0 }}
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
            reply: row.replies[0]?.text ?? null,
            teacherPick: row.teacherPick,
            skipReason: row.skipReason,
            nudgeUrl: nudgeHref(row.student.contactType, row.student.contactHandle),
            submissionId: row.id,
            markers: observationMarkers(row.analyses[0]?.observationsJson),
            submissionKind: row.kind,
          },
        ]}
      />
    </div>
  );
}
