import { notFound } from "next/navigation";
import { getStudentTokenFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSignedReadUrl } from "@/lib/storage";
import { StudentUpload } from "@/components/student/upload-form";
import { Strings } from "@/components/strings";
import { getLocale, getMessages } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function PieceLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const piece = await prisma.piece.findUnique({
    where: { code },
    include: { teacher: true, referenceMedia: true },
  });
  if (!piece || piece.archived) notFound();

  const token = await getStudentTokenFromCookie();
  const student = token
    ? await prisma.student.findFirst({ where: { token, teacherId: piece.teacherId } })
    : null;

  let referenceUrl: string | null = null;
  if (piece.referenceMedia) {
    try {
      referenceUrl = await createSignedReadUrl(piece.referenceMedia.storagePath);
    } catch {
      referenceUrl = null;
    }
  }

  const locale = await getLocale();
  const t = await getMessages(locale);

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 py-8">
      <Strings className="mb-6 text-ink" />
      <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">{piece.teacher.name}</p>
      <h1 className="font-display mt-2 text-3xl">{piece.title}</h1>
      {piece.note ? <p className="mt-3 text-ink-soft">{piece.note}</p> : null}
      {referenceUrl ? (
        <div className="mt-5">
          <p className="mb-2 text-sm">{t.student.reference}</p>
          <video src={referenceUrl} controls playsInline className="w-full rounded-2xl bg-black" />
        </div>
      ) : null}
      <div className="mt-8">
        <StudentUpload code={code} needsProfile={!student} />
      </div>
    </main>
  );
}
