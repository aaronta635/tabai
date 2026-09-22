import Link from "next/link";
import { redirect } from "next/navigation";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appOrigin } from "@/lib/origin";
import { getLocale, getMessages } from "@/lib/i18n";
import { teacherNavCounts } from "@/lib/teacher-stats";
import { classPulseForTeacher } from "@/lib/class-pulse";
import { formatWhen } from "@/lib/when";
import { CopyLink } from "@/components/teacher/copy-link";
import { SectionPanel } from "@/components/disclosure";

export default async function TeacherDashboard() {
  const teacher = await readTeacherSession();
  if (!teacher) redirect("/auth?next=/teacher");
  const locale = await getLocale();
  const t = await getMessages(locale);
  const origin = await appOrigin();
  const [counts, classes, nextSession, pulse] = await Promise.all([
    teacherNavCounts(teacher.id),
    prisma.class.findMany({
      where: { teacherId: teacher.id, archived: false },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { memberships: true } } },
    }),
    prisma.classSession.findFirst({
      where: { class: { teacherId: teacher.id, archived: false }, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      include: { class: { select: { name: true } } },
    }),
    classPulseForTeacher(teacher.id, locale),
  ]);
  const latestClass = classes[0];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">{t.teacher.dashHello.replace("{name}", teacher.name)}</h1>

      {classes.length === 0 ? (
        <section className="tile">
          <p className="tile-title">{t.teacher.dashEmpty}</p>
          <p className="mt-2 text-ink-soft">{t.teacher.linkHelp}</p>
          <Link href="/teacher/classes" className="btn mt-4">
            {t.teacher.createClassCta}
          </Link>
        </section>
      ) : (
        <>
          <section className="tile">
            <p className="eyebrow text-beat">{t.teacher.pulse}</p>
            <p className="mt-2 leading-relaxed">{pulse ? pulse.headline : t.teacher.pulseEmpty}</p>
          </section>

          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/teacher/classes" className="tile">
              <p className="eyebrow">{t.teacher.classCount}</p>
              <p className="font-display tabular mt-2 text-3xl">{classes.length}</p>
            </Link>
            <Link href="/teacher/submissions" className="tile">
              <p className="eyebrow">{t.teacher.unanswered}</p>
              <p className="font-display tabular mt-2 text-3xl">{counts.unanswered}</p>
            </Link>
            <Link href="/teacher/schedule" className="tile">
              <p className="eyebrow">{t.teacher.nextSession}</p>
              <p className="font-display mt-2 text-lg">
                {nextSession ? nextSession.class.name : t.teacher.noNextSession}
              </p>
              {nextSession ? (
                <p className="tile-meta tabular">{formatWhen(nextSession.startsAt, locale)}</p>
              ) : null}
            </Link>
          </div>

          {latestClass ? (
            <SectionPanel title={t.teacher.studentLink} count={latestClass.name}>
              <p className="break-all rounded-xl bg-paper px-3 py-3 text-sm">
                {origin}/c/{latestClass.code}
              </p>
              <div className="mt-3">
                <CopyLink url={`${origin}/c/${latestClass.code}`} />
              </div>
            </SectionPanel>
          ) : null}
        </>
      )}
    </div>
  );
}
