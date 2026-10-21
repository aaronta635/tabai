import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { CreateClassDialog } from "@/components/teacher/create-class-dialog";
import { GroupCard, meterWidth } from "@/components/studio/group-card";

export default async function ClassesPage() {
  const teacher = await readTeacherSession();
  if (!teacher) redirect(signInPath("tutor", "/teacher"));
  const locale = await getLocale();
  const t = await getMessages(locale);
  const classes = await prisma.class.findMany({
    where: { teacherId: teacher.id, archived: false },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          memberships: { where: { studentId: { not: null } } },
          assignments: true,
        },
      },
    },
  });
  const fullest = Math.max(0, ...classes.map((row) => row._count.memberships));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display">{t.teacher.classesTitle}</h1>
          <p className="page-meta">
            {t.teacher.activeCount.replace("{n}", String(classes.length))}
          </p>
        </div>
        <CreateClassDialog />
      </header>

      {classes.length === 0 ? (
        <p className="text-ink-soft">{t.teacher.classesEmpty}</p>
      ) : (
        <section className="space-y-3">
          <h2 className="font-display text-base">{t.teacher.groupsHeading}</h2>
          <div className="group-grid">
            {classes.map((row) => (
              <GroupCard
                key={row.id}
                href={`/teacher/classes/${row.id}`}
                title={row.name}
                chip={t.teacher.openGroup}
                meterLabel={t.teacher.enrolment}
                meterValue={String(row._count.memberships)}
                meterWidth={meterWidth(row._count.memberships, fullest)}
                actions={[
                  { href: "/teacher/schedule", label: t.teacher.attendance },
                  { href: `/teacher/classes/${row.id}`, label: t.teacher.assignedWork },
                ]}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
