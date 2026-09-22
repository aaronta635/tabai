import Link from "next/link";
import { redirect } from "next/navigation";
import { readStudentSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { studentClasses } from "@/lib/student-view";
import { JoinClassForm } from "@/components/student/join-class-form";
import { AddPanel } from "@/components/disclosure";

export default async function StudentClassesPage() {
  const student = await readStudentSession();
  if (!student) redirect("/auth?role=student");
  const locale = await getLocale();
  const t = await getMessages(locale);
  const classes = await studentClasses(student.id);

  return (
    <div className="space-y-7">
      <h1 className="font-display text-3xl">{t.student.classesTitle}</h1>

      <AddPanel label={t.student.joinClass} open={classes.length === 0}>
        <JoinClassForm
          placeholder={t.home.codePlaceholder}
          submit={t.student.joinClass}
          badCode={t.onboarding.badCode}
          otherClass={t.student.otherClass}
        />
        <p className="mt-3 text-sm text-ink-soft">{t.student.joinHelp}</p>
      </AddPanel>

      {classes.length === 0 ? (
        <p className="text-ink-soft">{t.student.stageExploringHelp}</p>
      ) : (
        <div className="tile-grid">
          {classes.map((row) => (
            <Link key={row.id} href={`/student/classes/${row.class.id}`} className="tile">
              <span className="seat-row" aria-hidden>
                {Array.from({ length: Math.min(row.class._count.memberships, 8) }).map((_, seat) => (
                  <i key={seat} className="seat-taken" />
                ))}
                {row.class._count.memberships === 0 ? <i className="seat-free" /> : null}
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
      )}
    </div>
  );
}
