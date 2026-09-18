import Link from "next/link";
import { redirect } from "next/navigation";
import { readTeacherSession } from "@/lib/auth";
import { listCatalogSlots } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { appOrigin } from "@/lib/origin";
import { getLocale, getMessages } from "@/lib/i18n";
import { CopyLink } from "@/components/teacher/copy-link";
import { PieceForm } from "@/components/teacher/piece-form";

function modelCopy(
  piece: {
    sheetMediaId: string | null;
    tutorialMediaId: string | null;
    models: { status: "training" | "ready" | "failed" }[];
  } | null,
  t: Awaited<ReturnType<typeof getMessages>>["teacher"],
) {
  const status = piece?.models[0]?.status;
  if (status === "ready") return t.modelReady;
  if (status === "training") return t.modelTraining;
  if (status === "failed") return t.modelFailed;
  if (!piece?.sheetMediaId || !piece?.tutorialMediaId) return t.modelNeedAssets;
  return t.modelTraining;
}

export default async function PiecesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const teacher = await readTeacherSession();
  if (!teacher) redirect("/auth?next=/teacher/pieces");
  const locale = await getLocale();
  const t = await getMessages(locale);
  const { created } = await searchParams;
  const origin = await appOrigin();
  const [slots, pieces] = await Promise.all([
    listCatalogSlots(),
    prisma.piece.findMany({
      where: { teacherId: teacher.id, archived: false },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { submissions: true } },
        models: { orderBy: { version: "desc" }, take: 1, select: { status: true } },
      },
    }),
  ]);
  const byCode = new Map(pieces.map((piece) => [piece.code, piece]));
  const catalogCodes = new Set(slots.map((slot) => slot.code));
  const extras = pieces.filter((piece) => !catalogCodes.has(piece.code));
  const newest = created
    ? pieces.find((p) => p.code === created)
    : slots.map((slot) => byCode.get(slot.code)).find(Boolean) ?? pieces[0];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.18em] uppercase text-ink-soft">{t.teacher.navInvite}</p>
        <h1 className="font-display mt-2 text-3xl">{t.teacher.linkTitle}</h1>
        <p className="mt-2 text-ink-soft">{t.teacher.linkHelp}</p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl">{t.teacher.catalogHeading}</h2>
          <p className="mt-1 text-sm text-ink-soft">{t.teacher.catalogHelp}</p>
        </div>
        {slots.map((slot) => {
          const piece = byCode.get(slot.code);
          return (
            <article key={slot.slug} className="lms-card space-y-3 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-beat">
                {t.teacher.catalogSlot.replace("{slug}", slot.slug)} · /l/{slot.code}
              </p>
              <p className="font-display text-xl">{piece?.title ?? slot.title}</p>
              {(piece?.note ?? slot.note) ? (
                <p className="text-sm text-ink-soft">{piece?.note ?? slot.note}</p>
              ) : null}
              <p className="text-xs text-ink-soft">
                {modelCopy(piece ?? null, t.teacher)}
              </p>
              <p className="flex flex-wrap gap-2 text-xs text-ink-soft">
                <span>
                  {t.teacher.catalogOnDisk}: {slot.sheetName ?? "—"} · {slot.tutorialName ?? "—"}
                </span>
                {piece?.sheetMediaId ? <span>{t.teacher.hasSheet}</span> : null}
                {piece?.tutorialMediaId ? <span>{t.teacher.hasTutorial}</span> : null}
              </p>
              {piece ? (
                <>
                  <p className="break-all text-xs text-ink-soft">
                    {origin}/l/{piece.code} · {piece._count.submissions} · {t.teacher.postLine}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <CopyLink url={`${origin}/l/${piece.code}`} />
                    <Link
                      href={`/l/${piece.code}`}
                      className="mt-3 rounded-full border border-ink/20 px-3 py-1 text-sm"
                    >
                      {t.teacher.openStudent}
                    </Link>
                  </div>
                </>
              ) : null}
              <PieceForm
                pieceId={piece?.id}
                catalogSlug={slot.slug}
                defaultTitle={piece?.title ?? slot.title}
                defaultNote={piece?.note ?? slot.note ?? ""}
                showMeta={!piece}
              />
            </article>
          );
        })}
      </section>

      {newest ? (
        <div className="lms-card border border-beat/40 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-beat">{t.teacher.studentLink}</p>
          <p className="font-display mt-2 text-2xl">{newest.title}</p>
          <p className="mt-3 break-all rounded-xl bg-paper px-3 py-3 text-sm">
            {origin}/l/{newest.code}
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            <CopyLink url={`${origin}/l/${newest.code}`} />
            <Link
              href={`/l/${newest.code}`}
              className="mt-3 rounded-full border border-ink/20 px-3 py-1 text-sm"
            >
              {t.teacher.openStudent}
            </Link>
          </div>
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-display text-xl">{t.teacher.otherPieces}</h2>
        <PieceForm />
        <ul className="space-y-4">
          {extras.map((piece) => (
            <li key={piece.id} className="lms-card space-y-3 p-4">
              <p className="font-display text-xl">{piece.title}</p>
              {piece.note ? <p className="text-sm text-ink-soft">{piece.note}</p> : null}
              <p className="text-xs text-ink-soft">{modelCopy(piece, t.teacher)}</p>
              <p className="flex flex-wrap gap-2 text-xs text-ink-soft">
                {piece.sheetMediaId ? <span>{t.teacher.hasSheet}</span> : null}
                {piece.tutorialMediaId ? <span>{t.teacher.hasTutorial}</span> : null}
              </p>
              <p className="break-all text-xs text-ink-soft">
                {origin}/l/{piece.code} · {piece._count.submissions} · {t.teacher.postLine}
              </p>
              <CopyLink url={`${origin}/l/${piece.code}`} />
              <PieceForm pieceId={piece.id} showMeta={false} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
