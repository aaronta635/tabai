import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { readStudentSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { formatDueLabel } from "@/lib/practice";
import { formatWhen } from "@/lib/when";
import { weekParam } from "@/lib/schedule";
import { studentClass } from "@/lib/student-view";
import { AssignmentMeta } from "@/components/student/assignment-meta";
import { SectionPanel } from "@/components/disclosure";

export default async function StudentClassPage({ params }: { params: Promise<{ id: string }> }) {
  const student = await readStudentSession();
  if (!student) redirect("/auth?role=student");
  const { id } = await params;
  const membership = await studentClass(student.id, id);
  if (!membership) notFound();
  const locale = await getLocale();
  const t = await getMessages(locale);
  const studioClass = membership.class;
  const pieces = studioClass.assignments.filter((row) => row.piece);

  return (
    <div className="space-y-5">
      <header>
        <Link href="/student/classes" className="font-ui text-sm text-ink-soft hover:text-ink">
          ← {t.student.navClasses}
        </Link>
        <h1 className="font-display mt-3 text-3xl">{studioClass.name}</h1>
        <p className="tile-meta mt-2">
          {t.student.teacherLabel}: {studioClass.teacher.name}
        </p>
      </header>

      {pieces[0] ? (
        <section className="tile">
          <p className="eyebrow text-beat">{t.student.thisWeek}</p>
          <h2 className="font-display mt-2 text-2xl">{pieces[0].piece!.title}</h2>
          {pieces[0].piece!.description || pieces[0].piece!.note ? (
            <p className="mt-3 leading-relaxed text-ink-soft">
              {pieces[0].piece!.description || pieces[0].piece!.note}
            </p>
          ) : null}
          <div className="mt-3">
            <AssignmentMeta
              goal={pieces[0].goal}
              dueLabel={pieces[0].dueAt ? formatDueLabel(pieces[0].dueAt, locale) : null}
              goalLabel={t.student.goal}
              duePrefix={t.student.due}
            />
          </div>
          <Link href={`/student/work/${pieces[0].piece!.code}`} className="btn mt-4">
            {t.student.openPiece}
          </Link>
        </section>
      ) : null}

      <SectionPanel title={t.student.assignedPieces} count={studioClass.assignments.length}>
        {studioClass.assignments.length === 0 ? (
          <p className="text-sm text-ink-soft">{t.student.noWork}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {studioClass.assignments.map((row) => (
              <li key={row.id}>
                {row.piece ? (
                  <Link href={`/student/work/${row.piece.code}`} className="chip chip-link">
                    <span>{row.piece.title}</span>
                    {row.dueAt ? (
                      <span className="tabular text-ink-soft">{formatDueLabel(row.dueAt, locale)}</span>
                    ) : null}
                  </Link>
                ) : (
                  <span className="chip">
                    <span>{row.part?.name ?? t.student.thisPiece}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionPanel>

      <SectionPanel title={t.student.nextLesson} count={studioClass.sessions.length}>
        {studioClass.sessions.length === 0 ? (
          <p className="text-sm text-ink-soft">{t.student.noLessonYet}</p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {studioClass.sessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/student/schedule?w=${weekParam(session.startsAt)}`}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span>{session.title || t.student.nextLesson}</span>
                  <span className="font-ui tabular text-xs text-ink-soft">
                    {formatWhen(session.startsAt, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionPanel>
    </div>
  );
}
