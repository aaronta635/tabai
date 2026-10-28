import { ParaIcon } from "@/components/ui/para-icon";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readStudentSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { formatDueLabel } from "@/lib/practice";
import { loadPieceClassroom } from "@/lib/piece-view";
import { prisma } from "@/lib/prisma";
import { formatWhen } from "@/lib/when";
import { PieceMedia } from "@/components/student/piece-media";
import { PracticeTimer } from "@/components/student/practice-timer";
import { StudentUpload } from "@/components/student/upload-form";
import { AddPanel } from "@/components/disclosure";

export default async function StudentPiecePage({ params }: { params: Promise<{ code: string }> }) {
  const student = await readStudentSession();
  if (!student) redirect(signInPath("student", "/student"));
  const { code } = await params;
  const room = await loadPieceClassroom(code);
  const locale = await getLocale();
  const t = await getMessages(locale);
  const dueAt = room.assigned?.dueAt ?? room.piece.dueAt;
  const dueLabel = dueAt ? formatDueLabel(dueAt, locale) : null;
  const goal = room.assigned?.goal ?? room.piece.goal;
  const brief = room.piece.description || room.piece.note;
  const tips = room.piece.tips && room.piece.tips !== brief ? room.piece.tips : null;
  const meta = [dueLabel ? `${t.student.due} ${dueLabel}` : null, goal].filter(Boolean).join(" · ");
  const history = room.bound.student
    ? await prisma.submission.findMany({
        where: { studentId: room.bound.student.id, pieceId: room.piece.id },
        orderBy: { submittedAt: "desc" },
        take: 5,
        select: {
          id: true,
          kind: true,
          submittedAt: true,
          replies: { take: 1, select: { grade: true } },
        },
      })
    : [];

  return (
    <div className="student-assignment space-y-5">
      <header className="studio-page-head">
        <Link href="/student/work" className="font-ui text-sm text-ink-soft hover:text-ink">
          ← {t.student.navWork}
        </Link>
        <h1 className="font-display mt-3">{t.student.submitVideo}</h1>
        <p className="studio-page-meta">{t.student.submitKicker}</p>
      </header>

      {room.bound.otherClass ? <p className="tile text-sm">{t.student.otherClass}</p> : null}
      {!room.canSubmit && room.bound.student ? <p className="tile text-sm">{t.student.joinHelp}</p> : null}

      {room.canSubmit ? <section className="student-material student-context space-y-4">
        <div>
          <p className="field-label">{t.student.thisPiece}</p>
          <h2>{room.piece.title}</h2>
          <p className="mt-2 text-sm">{t.student.teacherLabel}: {room.piece.teacher.name}</p>
          {meta ? <p className="page-meta">{meta}</p> : null}
        </div>
        {brief ? <div><h3 className="field-label">{t.student.brief}</h3><p className="whitespace-pre-wrap leading-relaxed">{brief}</p></div> : null}
        {tips ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{tips}</p> : null}
      </section> : null}

      <div className="student-assignment-desk">
        {room.tutorialUrl || room.clipUrl || room.sheetUrl ? (
          <div className="student-material student-reference">
            <PieceMedia
              compact
              tutorialUrl={room.tutorialUrl}
              clipUrl={room.clipUrl}
              sheetUrl={room.sheetUrl}
              sheetKind={room.sheetKind}
              sheetSync={room.sheetSync}
              labels={{
                reference: t.student.reference,
                clip: t.student.clip,
                sheet: t.student.sheet,
                openSheet: t.student.openSheet,
              }}
            />
          </div>
        ) : null}

        {room.canSubmit ? (
          <StudentUpload
            variant="studio"
            code={code}
            needsProfile={room.needsProfile}
            clipUrl={room.clipUrl}
            desk={{
              pieceTitle: room.piece.title,
              teacherName: room.piece.teacher.name,
              brief,
              tips,
              meta: meta || null,
            }}
          />
        ) : null}
      </div>

      <section className="student-material student-reading">
        <h2 className="font-display text-base">{t.student.sentBefore}</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">{t.student.noSentBefore}</p>
        ) : (
          <div className="sent-list mt-2">
            {history.map((row) => {
              const reply = row.replies[0];
              const kind =
                row.kind === "practice" ? t.student.kindPractice : row.kind === "overdub" ? t.student.kindOverdub : t.student.kindTake;
              return (
                <Link key={row.id} href={`/student/takes/${row.id}`}>
                  <span>
                    <span className="block font-medium">{kind}</span>
                    <span className="text-sm text-ink-soft">{formatWhen(row.submittedAt, locale)}</span>
                  </span>
                  <span className="status-chip is-quiet">{reply ? reply.grade || t.student.replied : t.student.waitingReply}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {room.canSubmit && !room.needsProfile ? (
        <AddPanel icon={<ParaIcon name="plus" />} label={t.student.practice}>
          <PracticeTimer code={code} />
        </AddPanel>
      ) : null}
    </div>
  );
}
