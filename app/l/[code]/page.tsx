import Link from "next/link";
import { redirect } from "next/navigation";
import { readStudentSession } from "@/lib/auth";
import { BrandMark } from "@/components/landing/brand-mark";
import { getLocale, getMessages } from "@/lib/i18n";
import { formatDueLabel } from "@/lib/practice";
import { loadPieceClassroom } from "@/lib/piece-view";
import { AssignmentMeta } from "@/components/student/assignment-meta";
import { LoopSpeedPlayer } from "@/components/student/loop-speed-player";
import { PracticeTimer } from "@/components/student/practice-timer";
import { StudentUpload } from "@/components/student/upload-form";

export const dynamic = "force-dynamic";

export default async function PieceLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await readStudentSession();
  if (session) redirect(`/student/work/${code}`);

  const room = await loadPieceClassroom(code);
  const locale = await getLocale();
  const t = await getMessages(locale);
  const dueAt = room.assigned?.dueAt ?? room.piece.dueAt;
  const dueLabel = dueAt ? formatDueLabel(dueAt, locale) : null;
  const blurb = room.piece.description || room.piece.note;

  return (
    <main className="student-shell mx-auto min-h-dvh max-w-lg px-5 py-8">
      <Link href="/" aria-label={t.brand} className="mb-6 inline-flex">
        <BrandMark />
      </Link>
      <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">{room.piece.teacher.name}</p>
      <h1 className="font-display mt-2 text-3xl">{room.piece.title}</h1>
      {blurb ? <p className="mt-3 text-ink-soft">{blurb}</p> : null}
      {room.piece.tips ? <p className="mt-2 text-sm">{room.piece.tips}</p> : null}
      <AssignmentMeta
        goal={room.assigned?.goal ?? room.piece.goal}
        dueLabel={dueLabel}
        goalLabel={t.student.goal}
        duePrefix={t.student.due}
      />
      {room.bound.otherClass ? (
        <p className="mt-6 rounded-2xl bg-cream px-4 py-3 text-sm">{t.student.otherClass}</p>
      ) : null}
      {!room.canSubmit && room.bound.student ? (
        <p className="mt-6 rounded-2xl bg-cream px-4 py-3 text-sm">{t.student.joinHelp}</p>
      ) : null}
      {room.tutorialUrl ? (
        <div className="mt-5">
          <LoopSpeedPlayer src={room.tutorialUrl} label={t.student.reference} />
        </div>
      ) : null}
      {room.clipUrl ? (
        <div className="mt-5">
          <LoopSpeedPlayer src={room.clipUrl} label={t.student.clip} />
        </div>
      ) : null}
      {room.sheetUrl ? (
        <div className="mt-5">
          <p className="mb-2 text-sm">{t.student.sheet}</p>
          {room.sheetKind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={room.sheetUrl} alt="" className="w-full rounded-2xl bg-white" />
          ) : room.sheetKind === "pdf" ? (
            <object data={room.sheetUrl} type="application/pdf" className="h-80 w-full rounded-2xl bg-white">
              <a href={room.sheetUrl} target="_blank" rel="noreferrer" className="text-sm underline">
                {t.student.openSheet}
              </a>
            </object>
          ) : (
            <a href={room.sheetUrl} target="_blank" rel="noreferrer" className="text-sm underline">
              {t.student.openSheet}
            </a>
          )}
        </div>
      ) : null}
      {room.canSubmit && !room.needsProfile ? (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium">{t.student.practice}</p>
          <PracticeTimer code={code} />
        </div>
      ) : null}
      <div className="mt-8">
        {room.canSubmit ? (
          <StudentUpload code={code} needsProfile={room.needsProfile} clipUrl={room.clipUrl} />
        ) : null}
      </div>
    </main>
  );
}
