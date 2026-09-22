import Link from "next/link";
import { redirect } from "next/navigation";
import { readStudentSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { formatDueLabel } from "@/lib/practice";
import { loadPieceClassroom } from "@/lib/piece-view";
import { AssignmentMeta } from "@/components/student/assignment-meta";
import { PieceMedia } from "@/components/student/piece-media";
import { PracticeTimer } from "@/components/student/practice-timer";
import { StudentUpload } from "@/components/student/upload-form";
import { AddPanel } from "@/components/disclosure";

export default async function StudentPiecePage({ params }: { params: Promise<{ code: string }> }) {
  const student = await readStudentSession();
  if (!student) redirect("/auth?role=student");
  const { code } = await params;
  const room = await loadPieceClassroom(code);
  const locale = await getLocale();
  const t = await getMessages(locale);
  const dueAt = room.assigned?.dueAt ?? room.piece.dueAt;
  const dueLabel = dueAt ? formatDueLabel(dueAt, locale) : null;
  const blurb = room.piece.description || room.piece.note;

  return (
    <div className="space-y-5">
      <header>
        <Link href="/student/work" className="font-ui text-sm text-ink-soft hover:text-ink">
          ← {t.student.navWork}
        </Link>
        <h1 className="font-display mt-3 text-3xl">{room.piece.title}</h1>
        <p className="tile-meta mt-2">
          {t.student.teacherLabel}: {room.piece.teacher.name}
        </p>
        {blurb ? <p className="mt-3 leading-relaxed text-ink-soft">{blurb}</p> : null}
        {room.piece.tips ? <p className="mt-2 text-sm">{room.piece.tips}</p> : null}
        <div className="mt-3">
          <AssignmentMeta
            goal={room.assigned?.goal ?? room.piece.goal}
            dueLabel={dueLabel}
            goalLabel={t.student.goal}
            duePrefix={t.student.due}
          />
        </div>
      </header>

      {room.bound.otherClass ? (
        <p className="tile text-sm">{t.student.otherClass}</p>
      ) : null}
      {!room.canSubmit && room.bound.student ? (
        <p className="tile text-sm">{t.student.joinHelp}</p>
      ) : null}

      <PieceMedia
        tutorialUrl={room.tutorialUrl}
        clipUrl={room.clipUrl}
        sheetUrl={room.sheetUrl}
        sheetKind={room.sheetKind}
        labels={{
          reference: t.student.reference,
          clip: t.student.clip,
          sheet: t.student.sheet,
          openSheet: t.student.openSheet,
        }}
      />

      {room.canSubmit && !room.needsProfile ? (
        <AddPanel label={t.student.practice}>
          <PracticeTimer code={code} />
        </AddPanel>
      ) : null}

      {room.canSubmit ? (
        <section className="tile">
          <StudentUpload code={code} needsProfile={room.needsProfile} clipUrl={room.clipUrl} />
        </section>
      ) : null}
    </div>
  );
}
