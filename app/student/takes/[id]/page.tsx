import { notFound, redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { deleteOwnTake } from "@/app/student/actions";
import { DeleteTakeButton } from "@/components/teacher/delete-take-button";
import { PracticeTakePitch } from "@/components/student/practice-session";
import { readStudentSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { signedMediaUrl } from "@/lib/media-view";
import { prisma } from "@/lib/prisma";
import { studentPitchCopy, toStudentPitchClip } from "@/lib/student-pitch";
import { formatWhen } from "@/lib/when";
import { ParaIcon } from "@/components/ui/para-icon";

export default async function StudentTakePage({ params }: { params: Promise<{ id: string }> }) {
  const student = await readStudentSession();
  if (!student) redirect(signInPath("student", "/student"));
  const { id } = await params;
  const locale = await getLocale();
  const t = await getMessages(locale);
  const take = await prisma.submission.findFirst({
    where: { id, studentId: student.id },
    select: {
      id: true,
      kind: true,
      submittedAt: true,
      studentNote: true,
      piece: { select: { title: true, demo: true } },
      media: { select: { storagePath: true } },
      replies: {
        orderBy: { sentAt: "desc" },
        take: 1,
        select: { text: true, grade: true },
      },
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { metricsJson: true, observationsJson: true },
      },
      jobs: {
        where: { type: "analyze" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, attempts: true, lastError: true, updatedAt: true },
      },
    },
  });
  if (!take) notFound();
  const video = await signedMediaUrl(take.media.storagePath);
  const reply = take.replies[0];
  const pitch = toStudentPitchClip({
    id: take.id,
    kind: take.kind,
    submittedAt: take.submittedAt,
    metricsJson: take.analyses[0]?.metricsJson ?? null,
    observationsJson: take.analyses[0]?.observationsJson ?? null,
    job: take.jobs[0] ?? null,
    copy: studentPitchCopy(t.student),
  });

  return (
    <div className="student-detail space-y-6">
      <header className="student-material student-reading">
        <h1 className="font-display">{take.piece.title}</h1>
        <p className="page-meta">{formatWhen(take.submittedAt, locale)}</p>
        {take.studentNote ? <p className="mt-3 whitespace-pre-wrap leading-relaxed">{take.studentNote}</p> : null}
      </header>
      {video ? (
        <video src={video} controls playsInline className="w-full max-w-3xl rounded-xl bg-black" />
      ) : (
        <p className="text-sm text-ink-soft">{t.student.videoPending}</p>
      )}
      {take.kind === "practice" ? (
        <PracticeTakePitch clip={pitch} />
      ) : (
        <section className="studio-panel student-reading space-y-3 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2>{reply ? t.student.replied : t.student.waitingReply}</h2>
            {reply?.grade ? <span className="status-chip">{reply.grade}</span> : null}
          </div>
          {reply && take.piece.demo ? <p className="page-meta">{t.student.letterFromPara}</p> : null}
          {reply ? <p className="whitespace-pre-wrap leading-relaxed">{reply.text}</p> : null}
        </section>
      )}
      <div className="student-destructive-zone">
        <DeleteTakeButton
          icon={<ParaIcon name="trash" />}
          submissionId={take.id}
          label={t.student.deleteTake}
          confirmLabel={t.student.deleteTakeConfirm}
          className="delete-take"
          afterHref="/student/takes"
          remove={deleteOwnTake}
        />
      </div>
    </div>
  );
}
