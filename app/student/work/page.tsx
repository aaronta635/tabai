import Link from "next/link";
import { redirect } from "next/navigation";
import { readStudentSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { assignmentsForStudent } from "@/lib/lms";
import { formatDueLabel } from "@/lib/practice";
import { AssignmentMeta } from "@/components/student/assignment-meta";

export default async function StudentWorkPage() {
  const student = await readStudentSession();
  if (!student) redirect("/auth?role=student");
  const locale = await getLocale();
  const t = await getMessages(locale);
  const assigned = (await assignmentsForStudent(student.id)).filter((row) => row.piece);

  const grouped = new Map<string, typeof assigned>();
  for (const row of assigned) {
    const key = row.class?.id ?? "direct";
    const list = grouped.get(key) ?? [];
    list.push(row);
    grouped.set(key, list);
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl">{t.student.workTitle}</h1>

      {assigned.length === 0 ? (
        <section className="tile">
          <p className="tile-title">{t.student.noWork}</p>
          <p className="mt-2 text-ink-soft">{t.student.stageInClassHelp}</p>
        </section>
      ) : (
        [...grouped.entries()].map(([key, rows]) => {
          const heading = rows[0]?.class?.name ?? t.student.assignedPieces;
          const teacher = rows[0]?.piece?.teacher?.name;
          return (
            <section key={key} className="space-y-3">
              <div>
                <h2 className="font-display text-xl">{heading}</h2>
                {teacher ? (
                  <p className="tile-meta">
                    {t.student.teacherLabel}: {teacher}
                  </p>
                ) : null}
              </div>
              <div className="tile-grid">
                {rows.map((row) => (
                  <Link key={row.id} href={`/student/work/${row.piece!.code}`} className="tile">
                    <p className="tile-title">{row.piece!.title}</p>
                    <div className="mt-3">
                      <AssignmentMeta
                        goal={row.goal}
                        dueLabel={row.dueAt ? formatDueLabel(row.dueAt, locale) : null}
                        goalLabel={t.student.goal}
                        duePrefix={t.student.due}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
