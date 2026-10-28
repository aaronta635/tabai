import Link from "next/link";
import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readStudentSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { assignmentsForStudent } from "@/lib/lms";
import { formatDueLabel } from "@/lib/practice";
import { studentClasses } from "@/lib/student-view";
import { ParaIcon } from "@/components/ui/para-icon";
import { classColor } from "@/lib/class-color";
import { weekParam, weekRangeUtc } from "@/lib/schedule";
import { weekPractice } from "@/lib/practice-week";
import { formatWhen } from "@/lib/when";
import { prisma } from "@/lib/prisma";
import { JoinClassForm } from "@/components/student/join-class-form";
import { AddPanel } from "@/components/disclosure";
import {
  AssignmentList,
  ClassChips,
  LessonCard,
  PracticeLog,
  ReviewTable,
  SideNote,
  StudioTitle,
  weekDayLabels,
} from "@/components/home/feed";

export default async function StudentHomePage() {
  const student = await readStudentSession();
  if (!student) redirect(signInPath("student", "/student"));

  const locale = await getLocale();
  const t = await getMessages(locale);
  const now = new Date();
  const { start, end } = weekRangeUtc(now);
  const [classes, assigned, replies, nextLesson, takes, sentPieces, practiceRows] = await Promise.all([
    studentClasses(student.id),
    assignmentsForStudent(student.id),
    prisma.reply.findMany({
      where: { submission: { studentId: student.id } },
      orderBy: { sentAt: "desc" },
      take: 3,
      select: {
        id: true,
        text: true,
        submission: { select: { id: true, piece: { select: { title: true, code: true } } } },
      },
    }),
    prisma.classSession.findFirst({
      where: {
        startsAt: { gte: now },
        class: { archived: false, memberships: { some: { studentId: student.id } } },
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        title: true,
        startsAt: true,
        class: { select: { id: true, name: true, teacher: { select: { name: true } } } },
      },
    }),
    prisma.submission.findMany({
      where: { studentId: student.id },
      orderBy: { submittedAt: "desc" },
      take: 4,
      select: {
        id: true,
        kind: true,
        submittedAt: true,
        piece: { select: { title: true, code: true } },
        replies: { take: 1, select: { id: true } },
      },
    }),
    prisma.submission.findMany({
      where: { studentId: student.id, kind: { in: ["take", "overdub"] } },
      select: { pieceId: true },
      distinct: ["pieceId"],
    }),
    prisma.practiceSession.findMany({
      where: { studentId: student.id, startedAt: { gte: start, lt: end } },
      select: { seconds: true, startedAt: true },
    }),
  ]);

  const pieces = assigned.filter((row) => row.piece);
  const sentPieceIds = new Set(sentPieces.map((row) => row.pieceId));
  const nextPiece =
    pieces.find((row) => row.piece && !sentPieceIds.has(row.piece.id))?.piece ?? pieces.find((row) => row.piece)?.piece;
  const submitHref = nextPiece ? `/student/work/${nextPiece.code}` : "/student/work";
  const practice = weekPractice(practiceRows, now);
  const latestReply = replies[0];

  return (
    <div className="space-y-6">
      <StudioTitle
        title={t.student.homeHello.replace("{name}", student.name)}
        action={
          classes.length > 0 && !nextPiece ? (
            <Link href={submitHref} className="btn submit-jump">
              {t.student.submitVideo}
            </Link>
          ) : undefined
        }
      />

      {classes.length === 0 ? (
        <section className="tile">
          <p className="tile-title">{t.student.joinTitle}</p>
          <p className="mt-2 text-ink-soft">{t.student.stageExploringHelp}</p>
          <div className="mt-4">
            <JoinClassForm
              placeholder={t.home.codePlaceholder}
              submit={t.student.joinClass}
              badCode={t.onboarding.badCode}
            />
          </div>
        </section>
      ) : (
        <div className="dash">
          <div className="space-y-6">
            <ClassChips
              label={t.student.navClasses}
              chips={classes.map((row) => ({
                id: row.class.id,
                name: row.class.name,
                href: `/student/classes/${row.class.id}`,
                color: classColor(row.class.id),
              }))}
            />

            {nextPiece ? (
              <section className="studio-panel student-current-piece">
                <p className="page-meta">{t.student.assignedPieces}</p>
                <h2>{nextPiece.title}</h2>
                <p className="text-sm">{t.student.teacherLabel}: {nextPiece.teacher.name}</p>
                <div className="student-actions">
                  <Link href={submitHref} className="btn">{t.student.submitVideo}</Link>
                </div>
              </section>
            ) : null}

            <AssignmentList
              title={t.student.assignedPieces}
              empty={t.student.noWork}
              track
              historyLabel={t.student.sentBefore}
              rows={pieces.slice(0, 5).flatMap((row) =>
                row.piece
                  ? [
                      {
                        href: `/student/work/${row.piece.code}`,
                        title: row.piece.title,
                        meta: [row.class?.name, row.goal].filter(Boolean).join(" · "),
                        status: row.dueAt ? formatDueLabel(row.dueAt, locale) : t.student.due,
                        progress: sentPieceIds.has(row.piece.id) ? 1 : 0,
                        fraction: sentPieceIds.has(row.piece.id) ? "1/1" : "0/1",
                      },
                    ]
                  : [],
              )}
            />

            <ReviewTable
              title={t.student.practiceVideos}
              empty={t.student.noTakes}
              columns={[t.student.thisPiece, t.student.colWhen, t.student.colStatus]}
              rows={takes.map((row) => ({
                href: `/student/takes/${row.id}`,
                title: row.piece.title,
                meta: row.kind === "practice" ? t.student.kindPractice : t.student.kindTake,
                when: formatWhen(row.submittedAt, locale),
                status: row.replies[0] ? t.student.replied : t.student.waitingReply,
              }))}
            />

            <AddPanel icon={<ParaIcon name="plus" />} label={t.student.joinAnother}>
              <JoinClassForm
                placeholder={t.home.codePlaceholder}
                submit={t.student.joinClass}
                badCode={t.onboarding.badCode}
              />
            </AddPanel>
          </div>
          <aside className="space-y-3">
            <section className="studio-panel space-y-3">
              <h2 className="font-display text-base"><ParaIcon name="calendar" /> {t.student.nextLesson}</h2>
              {nextLesson ? (
                <div className="lesson-card-row">
                  <LessonCard
                    href={`/student/schedule?w=${weekParam(nextLesson.startsAt)}`}
                    time={formatWhen(nextLesson.startsAt, locale)}
                    title={nextLesson.title || nextLesson.class.name}
                    meta={`${nextLesson.class.name} · ${nextLesson.class.teacher.name}`}
                    status={t.student.upcoming}
                    next
                  />
                </div>
              ) : (
                <Link href="/student/schedule" className="text-sm underline underline-offset-4">{t.student.noLessonYet}</Link>
              )}
            </section>

            <SideNote
              kicker={t.student.recentFeedback}
              title={latestReply ? latestReply.submission.piece.title : t.student.noFeedback}
              href={latestReply ? `/student/takes/${latestReply.submission.id}` : undefined}
            >
              {latestReply ? <p className="line-clamp line-clamp-3">{latestReply.text}</p> : null}
            </SideNote>
            <PracticeLog
              title={t.studio.practiceLog}
              caption={
                practice.totalMinutes > 0
                  ? t.studio.practiceMinutes.replace("{n}", String(practice.totalMinutes))
                  : t.studio.practiceLogEmpty
              }
              days={weekDayLabels(locale)}
              heights={practice.heights}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
