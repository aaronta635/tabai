import Link from "next/link";
import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readTeacherSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export default async function TeacherRosterPage() {
  const teacher = await readTeacherSession();
  if (!teacher) redirect(signInPath("tutor", "/teacher"));
  const locale = await getLocale();
  const t = await getMessages(locale);
  const students = await prisma.student.findMany({
    where: { teacherId: teacher.id, approvedAt: { not: null } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      memberships: {
        where: { class: { teacherId: teacher.id, archived: false } },
        select: { class: { select: { id: true, name: true } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display">{t.teacher.rosterTitle}</h1>
        <p className="page-meta">{t.teacher.rosterCount.replace("{n}", String(students.length))}</p>
      </header>
      {students.length === 0 ? (
        <p className="text-ink-soft">{t.teacher.rosterEmpty}</p>
      ) : (
        <section className="studio-panel">
          <table className="studio-table">
            <thead>
              <tr>
                <th>{t.teacher.navProfile}</th>
                <th>{t.teacher.navClasses}</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="font-semibold">{student.name}</td>
                  <td>
                    {student.memberships.length === 0
                      ? "—"
                      : student.memberships.map((row) => (
                          <Link key={row.class.id} href={`/teacher/classes/${row.class.id}`} className="mr-3">
                            {row.class.name}
                          </Link>
                        ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
