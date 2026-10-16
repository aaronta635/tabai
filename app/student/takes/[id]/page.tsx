import { notFound, redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { deleteOwnTake } from "@/app/student/actions";
import { DeleteTakeButton } from "@/components/teacher/delete-take-button";
import { readStudentSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { signedMediaUrl } from "@/lib/media-view";
import { prisma } from "@/lib/prisma";
import { formatWhen } from "@/lib/when";

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
      submittedAt: true,
      studentNote: true,
      piece: { select: { title: true } },
      media: { select: { storagePath: true } },
      replies: {
        orderBy: { sentAt: "desc" },
        take: 1,
        select: { text: true, grade: true },
      },
    },
  });
  if (!take) notFound();
  const video = await signedMediaUrl(take.media.storagePath);
  const reply = take.replies[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display">{take.piece.title}</h1>
        <p className="page-meta">{formatWhen(take.submittedAt, locale)}</p>
        {take.studentNote ? <p className="mt-3 whitespace-pre-wrap leading-relaxed">{take.studentNote}</p> : null}
      </header>
      {video ? (
        <video src={video} controls playsInline className="w-full max-w-3xl rounded-xl bg-black" />
      ) : (
        <p className="text-sm text-ink-soft">{t.student.videoPending}</p>
      )}
      <section className="studio-panel space-y-3 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2>{reply ? t.student.replied : t.student.waitingReply}</h2>
          {reply?.grade ? <span className="status-chip">{reply.grade}</span> : null}
        </div>
        {reply ? <p className="whitespace-pre-wrap leading-relaxed">{reply.text}</p> : null}
      </section>
      <DeleteTakeButton
        submissionId={take.id}
        label={t.student.deleteTake}
        confirmLabel={t.student.deleteTakeConfirm}
        className="delete-take"
        afterHref="/student/takes"
        remove={deleteOwnTake}
      />
    </div>
  );
}
