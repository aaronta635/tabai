import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStudentAccount } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { initialsOf } from "@/lib/initials";
import { studentClasses } from "@/lib/student-view";
import { JoinClassForm } from "@/components/student/join-class-form";
import { AddPanel } from "@/components/disclosure";

export default async function StudentProfilePage() {
  const student = await requireStudentAccount();
  if (!student) redirect("/auth?role=student");
  const locale = await getLocale();
  const t = await getMessages(locale);
  const classes = await studentClasses(student.id);

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-4">
        <span className="avatar-btn font-ui" aria-hidden>
          {initialsOf(student.name)}
        </span>
        <h1 className="font-display text-3xl">{student.name}</h1>
      </header>

      <section className="tile space-y-3">
        <div>
          <p className="field-label">{t.student.email}</p>
          <p className="mt-1">{student.email ?? t.student.noEmail}</p>
        </div>
        <div>
          <p className="field-label">{t.student.contact}</p>
          <p className="mt-1">{student.contactHandle}</p>
        </div>
        <div>
          <p className="field-label">{t.student.yourClasses}</p>
          <ul className="mt-1 space-y-1">
            {classes.length === 0 ? (
              <li className="text-ink-soft">{t.student.stageExploring}</li>
            ) : (
              classes.map((row) => (
                <li key={row.id}>
                  <Link href={`/student/classes/${row.class.id}`} className="hover:text-beat">
                    {row.class.name} · {t.student.teacherLabel}: {row.class.teacher.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
        <Link href="/student/takes" className="btn btn-quiet inline-flex">
          {t.student.yourPage}
        </Link>
      </section>

      <AddPanel label={t.student.joinAnother}>
        <JoinClassForm
          placeholder={t.home.codePlaceholder}
          submit={t.student.joinClass}
          badCode={t.onboarding.badCode}
          otherClass={t.student.otherClass}
        />
      </AddPanel>
    </div>
  );
}
