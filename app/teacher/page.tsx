import Link from "next/link";
import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appOrigin } from "@/lib/origin";
import { getLocale, getMessages } from "@/lib/i18n";
import { cachedClassPulseForTeacher } from "@/lib/class-pulse";
import { classColor } from "@/lib/class-color";
import { formatTime, formatWait, formatWhen } from "@/lib/when";
import { weekParam, weekRangeUtc } from "@/lib/schedule";
import { weekPractice } from "@/lib/practice-week";
import { classJoinPath } from "@/lib/lms";
import { CopyLink } from "@/components/teacher/copy-link";
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

export default async function TeacherDashboard() {
  const teacher = await readTeacherSession();
  if (!teacher) redirect(signInPath("tutor", "/teacher"));
  const locale = await getLocale();
  const t = await getMessages(locale);
  const origin = await appOrigin();
  const now = new Date();
  const { start, end } = weekRangeUtc(now);
  const [classes, nextLessons, waiting, dueSoon, pulse, practiceRows] = await Promise.all([
    prisma.class.findMany({
      where: { teacherId: teacher.id, archived: false },
      orderBy: { createdAt: "desc" },
    }),
    prisma.classSession.findMany({
      where: { class: { teacherId: teacher.id, archived: false }, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 4,
      relationLoadStrategy: "join",
      include: { class: { select: { id: true, name: true } } },
    }),
    prisma.submission.findMany({
      where: {
        piece: { teacherId: teacher.id },
        kind: { in: ["take", "overdub"] },
        status: { in: ["new", "drafted"] },
      },
      orderBy: { submittedAt: "asc" },
      take: 5,
      relationLoadStrategy: "join",
      select: {
        id: true,
        submittedAt: true,
        student: { select: { name: true } },
        piece: { select: { title: true } },
      },
    }),
    prisma.assignment.findMany({
      where: {
        dueAt: { not: null, gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        pieceId: { not: null },
        OR: [
          { class: { teacherId: teacher.id, archived: false } },
          { student: { teacherId: teacher.id } },
        ],
      },
      orderBy: { dueAt: "asc" },
      take: 5,
      relationLoadStrategy: "join",
      select: {
        id: true,
        dueAt: true,
        pieceId: true,
        piece: { select: { id: true, title: true } },
        class: {
          select: {
            id: true,
            name: true,
            memberships: {
              where: { student: { approvedAt: { not: null } } },
              select: { studentId: true },
            },
          },
        },
        student: { select: { id: true, name: true } },
      },
    }),
    cachedClassPulseForTeacher(teacher.id, locale),
    prisma.practiceSession.findMany({
      where: { startedAt: { gte: start, lt: end }, student: { teacherId: teacher.id } },
      select: { seconds: true, startedAt: true },
    }),
  ]);
  const pieceIds = dueSoon.flatMap((row) => (row.pieceId ? [row.pieceId] : []));
  const sentRows = pieceIds.length
    ? await prisma.submission.findMany({
        where: { pieceId: { in: pieceIds }, kind: { in: ["take", "overdub"] } },
        select: { pieceId: true, studentId: true },
        distinct: ["pieceId", "studentId"],
      })
    : [];
  const sentByPiece = new Map<string, Set<string>>();
  for (const row of sentRows) {
    const set = sentByPiece.get(row.pieceId) ?? new Set<string>();
    set.add(row.studentId);
    sentByPiece.set(row.pieceId, set);
  }
  const practice = weekPractice(practiceRows, now);
  const latestClass = classes[0];
  const next = nextLessons[0];
  const meta = next
    ? `${next.class.name} · ${formatWhen(next.startsAt, locale)}`
    : `${t.teacher.classCount} ${classes.length}`;

  return (
    <div className="space-y-6">
      <StudioTitle title={t.teacher.dashHello.replace("{name}", teacher.name)} meta={classes.length ? meta : undefined} />

      {classes.length === 0 ? (
        <section className="tile">
          <p className="tile-title">{t.teacher.dashEmpty}</p>
          <p className="mt-2 text-ink-soft">{t.teacher.linkHelp}</p>
          <Link href="/teacher/classes" className="btn mt-4">
            {t.teacher.createClassCta}
          </Link>
        </section>
      ) : (
        <div className="dash">
          <div className="space-y-6">
          <ClassChips
            label={t.teacher.navClasses}
            chips={classes.map((row) => ({
              id: row.id,
              name: row.name,
              href: `/teacher/classes/${row.id}`,
              color: classColor(row.id),
            }))}
          />

          <section className="space-y-3">
            <h2 className="font-display text-base">{t.teacher.nextLessons}</h2>
            {nextLessons.length === 0 ? (
              <p className="text-sm text-ink-soft">{t.teacher.noNextSession}</p>
            ) : (
              <div className="lesson-card-row">
                {nextLessons.map((session, index) => (
                  <LessonCard
                    key={session.id}
                    href={`/teacher/schedule?w=${weekParam(session.startsAt)}&session=${session.id}`}
                    time={formatTime(session.startsAt, locale)}
                    title={session.title || session.class.name}
                    meta={session.class.name}
                    status={t.teacher.upcoming}
                    next={index === 0}
                  />
                ))}
              </div>
            )}
          </section>

          <ReviewTable
            title={t.teacher.unanswered}
            empty={t.teacher.noUnanswered}
            columns={[t.teacher.colStudent, t.teacher.fromDate, t.teacher.colStatus]}
            rows={waiting.map((row) => {
              const wait = formatWait(row.submittedAt, now);
              const waitLabel = (wait.unit === "hours" ? t.teacher.waitHours : t.teacher.waitDays).replace(
                "{n}",
                String(wait.n),
              );
              return {
                href: `/teacher/submissions/${row.id}`,
                title: row.student.name,
                meta: row.piece.title,
                when: waitLabel,
                status: t.teacher.unanswered,
              };
            })}
          />

          <AssignmentList
            title={t.teacher.dueSoon}
            empty={t.teacher.noDueSoon}
            track
            rows={dueSoon.flatMap((row) => {
              if (!row.piece) return [];
              const sent = sentByPiece.get(row.piece.id) ?? new Set<string>();
              const roster = row.class
                ? row.class.memberships.flatMap((member) => (member.studentId ? [member.studentId] : []))
                : row.student
                  ? [row.student.id]
                  : [];
              const done = roster.filter((id) => sent.has(id)).length;
              const total = roster.length;
              return [
                {
                  href: `/teacher/curriculum/${row.piece.id}`,
                  title: row.piece.title,
                  meta: row.class?.name ?? row.student?.name ?? "",
                  status: row.dueAt ? formatWhen(row.dueAt, locale) : t.teacher.dueSoon,
                  progress: total > 0 ? done / total : 0,
                  fraction: total > 0 ? `${done}/${total}` : "—",
                },
              ];
            })}
          />

          <section className="studio-panel">
            <h2 className="font-display">{t.teacher.pulse}</h2>
            <p className="mb-4 text-sm leading-relaxed">{pulse ? pulse.headline : t.teacher.pulseEmpty}</p>
          </section>

          {latestClass ? (
            <p className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
              <span>
                {t.teacher.studentLink}: {latestClass.name}
              </span>
              <CopyLink url={`${origin}${classJoinPath(latestClass.code)}`} copy={t.teacher.copyLink} copied={t.teacher.linkCopied} />
            </p>
          ) : null}
          </div>
          <aside className="space-y-3">
            <SideNote
              kicker={t.teacher.nextLessons}
              title={next ? next.title || next.class.name : t.teacher.noNextSession}
              meta={next ? `${next.class.name} · ${formatTime(next.startsAt, locale)}` : undefined}
              href={
                next
                  ? `/teacher/schedule?w=${weekParam(next.startsAt)}&session=${next.id}`
                  : "/teacher/schedule"
              }
            />
            <SideNote
              kicker={t.teacher.reviewQueue}
              title={waiting.length ? String(waiting.length) : t.teacher.noUnanswered}
              href="/teacher/submissions"
            >
              {waiting.slice(0, 2).map((row) => (
                <p key={row.id}>
                  {row.student.name} · {row.piece.title}
                </p>
              ))}
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
