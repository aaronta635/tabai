import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSignedReadUrl } from "@/lib/storage";
import { Strings } from "@/components/strings";
import { getLocale, getMessages } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function StudentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const student = await prisma.student.findUnique({
    where: { token },
    include: {
      teacher: true,
      submissions: {
        include: {
          piece: true,
          media: true,
          replies: { orderBy: { sentAt: "desc" }, take: 1 },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
  if (!student) notFound();

  const locale = await getLocale();
  const t = await getMessages(locale);

  const withUrls = await Promise.all(
    student.submissions.map(async (submission) => {
      let url: string | null = null;
      try {
        url = await createSignedReadUrl(submission.media.storagePath);
      } catch {
        url = null;
      }
      return { ...submission, url };
    }),
  );

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 py-8">
      <Strings className="mb-6 text-ink" />
      <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">{student.teacher.name}</p>
      <h1 className="font-display mt-2 text-3xl">{t.student.yourPage}</h1>
      <p className="mt-1 text-ink-soft">{student.name}</p>
      <div className="mt-8 space-y-8">
        {withUrls.map((submission) => (
          <article key={submission.id} className="rounded-2xl bg-white/80 p-4">
            <p className="text-sm text-ink-soft">{submission.piece.title}</p>
            {submission.url ? (
              <video src={submission.url} controls playsInline className="mt-3 w-full rounded-xl bg-black" />
            ) : null}
            {submission.replies[0] ? (
              <div className="mt-4">
                <p className="text-xs tracking-[0.2em] uppercase text-forest">{t.student.replyFrom}</p>
                <p className="mt-2 leading-relaxed">{submission.replies[0].text}</p>
              </div>
            ) : (
              <p className="mt-4 text-ink-soft">{t.student.waiting}</p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
