import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readStudentSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { studentClasses } from "@/lib/student-view";
import { JoinClassForm } from "@/components/student/join-class-form";
import { AddPanel } from "@/components/disclosure";
import { GroupCard, meterWidth } from "@/components/studio/group-card";

export default async function StudentClassesPage() {
  const student = await readStudentSession();
  if (!student) redirect(signInPath("student", "/student"));
  const locale = await getLocale();
  const t = await getMessages(locale);
  const classes = await studentClasses(student.id);
  const fullest = Math.max(0, ...classes.map((row) => row.class._count.memberships));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display">{t.student.classesTitle}</h1>
        <p className="page-meta">{t.student.activeCount.replace("{n}", String(classes.length))}</p>
      </header>

      <AddPanel label={t.student.joinClass} open={classes.length === 0}>
        <JoinClassForm
          placeholder={t.home.codePlaceholder}
          submit={t.student.joinClass}
          badCode={t.onboarding.badCode}
        />
        <p className="mt-3 text-sm text-ink-soft">{t.student.joinHelp}</p>
      </AddPanel>

      {classes.length === 0 ? (
        <p className="text-ink-soft">{t.student.stageExploringHelp}</p>
      ) : (
        <section className="space-y-3">
          <h2 className="font-display text-base">{t.student.groupsHeading}</h2>
          <div className="group-grid">
            {classes.map((row) => (
              <GroupCard
                key={row.id}
                href={`/student/classes/${row.class.id}`}
                title={row.class.name}
                meta={`${t.student.teacherLabel}: ${row.class.teacher.name}`}
                chip={t.student.openGroup}
                meterLabel={t.student.countClassmates.replace("{n}", "").trim()}
                meterValue={String(row.class._count.memberships)}
                meterWidth={meterWidth(row.class._count.memberships, fullest)}
                actions={[
                  { href: "/student/schedule", label: t.student.navSchedule },
                  { href: "/student/work", label: t.student.workTitle },
                ]}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
