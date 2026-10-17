import Link from "next/link";
import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readTeacherSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { appOrigin } from "@/lib/origin";
import { ensureReportToken } from "@/lib/weekly-report";
import { CopyLink } from "@/components/teacher/copy-link";

export default async function TeacherRosterPage() {
  const teacher = await readTeacherSession();
  if (!teacher) redirect(signInPath("tutor", "/teacher"));
  const locale = await getLocale();
  const t = await getMessages(locale);
  const rows = await prisma.student.findMany({
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
  const origin = await appOrigin();
  const students = await Promise.all(
    rows.map(async (student) => ({
      ...student,
      reportUrl: await ensureReportToken(student.id).then((token) => (token ? `${origin}/r/${token}` : null)),
    })),
  );

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
                <th>{t.teacher.parentReport}</th>
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
                  <td>
                    {student.reportUrl ? (
                      <CopyLink url={student.reportUrl} copy={t.teacher.copyLink} copied={t.teacher.linkCopied} />
                    ) : (
                      "—"
                    )}
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
