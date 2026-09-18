import Link from "next/link";
import { notFound } from "next/navigation";
import { studentForPiece } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSignedReadUrl } from "@/lib/storage";
import { StudentUpload } from "@/components/student/upload-form";
import { BrandMark } from "@/components/landing/brand-mark";
import { getLocale, getMessages } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type StoredMedia = { storagePath: string };

function sheetView(path: string): "pdf" | "image" | "file" {
  const name = path.split("/").pop()?.split("?")[0]?.toLowerCase() ?? "";
  if (/\.(png|jpe?g|webp)$/.test(name)) return "image";
  if (name.endsWith(".pdf") || !name.includes(".")) return "pdf";
  return "file";
}

function mediaStoragePath(media: unknown): string | null {
  if (!media || typeof media !== "object") return null;
  if (!("storagePath" in media)) return null;
  const path = (media as StoredMedia).storagePath;
  return typeof path === "string" ? path : null;
}

async function signedMediaUrl(path: string | null) {
  if (!path || path === "pending") return null;
  try {
    return await createSignedReadUrl(path);
  } catch {
    return null;
  }
}

export default async function PieceLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const piece = await prisma.piece.findUnique({
    where: { code },
    select: {
      title: true,
      note: true,
      archived: true,
      teacherId: true,
      teacher: { select: { name: true } },
      sheetMedia: { select: { storagePath: true } },
      tutorialMedia: { select: { storagePath: true } },
      referenceMedia: { select: { storagePath: true } },
    },
  });
  if (!piece || piece.archived) notFound();

  const bound = await studentForPiece(piece.teacherId);
  const student = bound.student;
  const needsProfile = !student;

  const tutorialPath =
    mediaStoragePath(piece.tutorialMedia) ?? mediaStoragePath(piece.referenceMedia);
  const sheetPath = mediaStoragePath(piece.sheetMedia);
  const tutorialUrl = await signedMediaUrl(tutorialPath);
  const sheetUrl = await signedMediaUrl(sheetPath);
  const sheetKind = sheetView(sheetPath ?? "");

  const locale = await getLocale();
  const t = await getMessages(locale);

  return (
    <main className="student-shell mx-auto min-h-dvh max-w-lg px-5 py-8">
      <Link href="/" aria-label={t.brand} className="mb-6 inline-flex">
        <BrandMark />
      </Link>
      <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">{piece.teacher.name}</p>
      <h1 className="font-display mt-2 text-3xl">{piece.title}</h1>
      {piece.note ? <p className="mt-3 text-ink-soft">{piece.note}</p> : null}
      {bound.otherClass ? (
        <p className="mt-6 rounded-2xl bg-cream px-4 py-3 text-sm">{t.student.otherClass}</p>
      ) : null}
      {tutorialUrl ? (
        <div className="mt-5">
          <p className="mb-2 text-sm">{t.student.reference}</p>
          <video src={tutorialUrl} controls playsInline className="w-full rounded-2xl bg-black" />
        </div>
      ) : null}
      {sheetUrl ? (
        <div className="mt-5">
          <p className="mb-2 text-sm">{t.student.sheet}</p>
          {sheetKind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sheetUrl} alt="" className="w-full rounded-2xl bg-white" />
          ) : sheetKind === "pdf" ? (
            <object
              data={sheetUrl}
              type="application/pdf"
              className="h-80 w-full rounded-2xl bg-white"
            >
              <a href={sheetUrl} target="_blank" rel="noreferrer" className="text-sm underline">
                {t.student.openSheet}
              </a>
            </object>
          ) : (
            <a href={sheetUrl} target="_blank" rel="noreferrer" className="text-sm underline">
              {t.student.openSheet}
            </a>
          )}
        </div>
      ) : null}
      <div className="mt-8">
        {bound.otherClass ? null : <StudentUpload code={code} needsProfile={needsProfile} />}
      </div>
    </main>
  );
}
