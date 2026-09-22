import Link from "next/link";
import { redirect } from "next/navigation";
import { readStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { assignmentsForStudent } from "@/lib/lms";
import { activityStreak, formatDueLabel, pickAssignedPiece } from "@/lib/practice";
import { studentClasses } from "@/lib/student-view";
import { JoinClassForm } from "@/components/student/join-class-form";
import { AssignmentMeta } from "@/components/student/assignment-meta";
import { AddPanel, SectionPanel } from "@/components/disclosure";

export default async function StudentHomePage() {
  const student = await readStudentSession();
  if (!student) redirect("/auth?role=student");

  const locale = await getLocale();
  const t = await getMessages(locale);
  const [classes, assigned, takes, practices, replies] = await Promise.all([
    studentClasses(student.id),
    assignmentsForStudent(student.id),
    prisma.submission.findMany({
      where: { studentId: student.id },
      select: { submittedAt: true, status: true, kind: true },
    }),
    prisma.practiceSession.findMany({
      where: { studentId: student.id },
      select: { startedAt: true },
    }),
    prisma.reply.findMany({
      where: { submission: { studentId: student.id } },
      orderBy: { sentAt: "desc" },
      take: 3,
      select: { id: true, text: true, submission: { select: { piece: { select: { title: true } } } } },
    }),
  ]);

  const pieces = assigned.filter((row) => row.piece);
  const featured = pickAssignedPiece(pieces);
  const waiting = takes.filter(
    (row) => row.kind !== "practice" && (row.status === "new" || row.status === "drafted"),
  ).length;
  const streak = activityStreak([
    ...takes.map((row) => row.submittedAt),
    ...practices.map((row) => row.startedAt),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">{t.student.homeHello.replace("{name}", student.name)}</h1>

      {classes.length === 0 ? (
        <section className="tile">
          <p className="tile-title">{t.student.joinTitle}</p>
          <p className="mt-2 text-ink-soft">{t.student.stageExploringHelp}</p>
          <div className="mt-4">
            <JoinClassForm
              placeholder={t.home.codePlaceholder}
              submit={t.student.joinClass}
              badCode={t.onboarding.badCode}
              otherClass={t.student.otherClass}
            />
          </div>
        </section>
      ) : (
        <>
          {featured?.piece ? (
            <section className="tile">
              <p className="eyebrow text-beat">{t.student.thisWeek}</p>
              <h2 className="font-display mt-2 text-2xl">{featured.piece.title}</h2>
              <p className="tile-meta">
                {[featured.piece.teacher?.name, featured.class?.name].filter(Boolean).join(" · ")}
              </p>
              {featured.piece.description || featured.piece.note ? (
                <p className="mt-3 leading-relaxed text-ink-soft">
                  {featured.piece.description || featured.piece.note}
                </p>
              ) : null}
              <div className="mt-3">
                <AssignmentMeta
                  goal={featured.goal}
                  dueLabel={featured.dueAt ? formatDueLabel(featured.dueAt, locale) : null}
                  goalLabel={t.student.goal}
                  duePrefix={t.student.due}
                />
              </div>
              <Link href={`/student/work/${featured.piece.code}`} className="btn mt-4">
                {t.student.openPiece}
              </Link>
            </section>
          ) : (
            <section className="tile">
              <p className="tile-title">{t.student.noWork}</p>
              <p className="mt-2 text-ink-soft">{t.student.stageInClassHelp}</p>
            </section>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/student/work" className="tile">
              <p className="eyebrow">{t.student.piecesAssigned}</p>
              <p className="font-display tabular mt-2 text-3xl">{pieces.length}</p>
            </Link>
            <Link href="/student/takes" className="tile">
              <p className="eyebrow">{t.student.waitingReply}</p>
              <p className="font-display tabular mt-2 text-3xl">{waiting}</p>
            </Link>
            <Link href="/student/progress" className="tile">
              <p className="eyebrow">{t.student.streak.replace("{n}", String(streak))}</p>
              <p className="font-display tabular mt-2 text-3xl">{streak}</p>
            </Link>
          </div>

          <div className="tile-grid">
            {classes.map((row) => (
              <Link key={row.id} href={`/student/classes/${row.class.id}`} className="tile">
                <span className="seat-row" aria-hidden>
                  {Array.from({ length: Math.min(row.class._count.memberships, 8) }).map((_, seat) => (
                    <i key={seat} className="seat-taken" />
                  ))}
                </span>
                <p className="tile-title">{row.class.name}</p>
                <p className="tile-meta">
                  {t.student.teacherLabel}: {row.class.teacher.name}
                </p>
                <p className="tile-meta">
                  <span className="tabular">
                    {t.student.countClassmates.replace("{n}", String(row.class._count.memberships))}
                  </span>
                  <span className="tabular">
                    {t.student.countAssigned.replace("{n}", String(row.class._count.assignments))}
                  </span>
                </p>
              </Link>
            ))}
          </div>

          <AddPanel label={t.student.joinAnother}>
            <JoinClassForm
              placeholder={t.home.codePlaceholder}
              submit={t.student.joinClass}
              badCode={t.onboarding.badCode}
              otherClass={t.student.otherClass}
            />
          </AddPanel>

          {replies.length > 0 ? (
            <SectionPanel title={t.student.lastReplies} count={replies.length}>
              <ul className="space-y-3">
                {replies.map((reply) => (
                  <li key={reply.id}>
                    <p className="eyebrow">{reply.submission.piece.title}</p>
                    <p className="mt-1 leading-relaxed">{reply.text}</p>
                  </li>
                ))}
              </ul>
            </SectionPanel>
          ) : null}
        </>
      )}
    </div>
  );
}
