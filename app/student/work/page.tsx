import Link from "next/link";
import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readStudentSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { assignmentsForStudent } from "@/lib/lms";
import { prisma } from "@/lib/prisma";
import { formatDueLabel } from "@/lib/practice";

export default async function StudentWorkPage() {
  const student = await readStudentSession();
  if (!student) redirect(signInPath("student", "/student"));
  const locale = await getLocale();
  const t = await getMessages(locale);
  const assigned = (await assignmentsForStudent(student.id)).filter((row) => row.piece);
  const sent = await prisma.submission.findMany({
    where: { studentId: student.id, kind: { in: ["take", "overdub"] } },
    select: { pieceId: true },
    distinct: ["pieceId"],
  });
  const sentIds = new Set(sent.map((row) => row.pieceId));
  const nextPiece =
    assigned.find((row) => row.piece && !sentIds.has(row.piece.id))?.piece ?? assigned.find((row) => row.piece)?.piece;

  const grouped = new Map<string, typeof assigned>();
  for (const row of assigned) {
    const key = row.class?.id ?? "direct";
    const list = grouped.get(key) ?? [];
    list.push(row);
    grouped.set(key, list);
  }

  return (
    <div className="space-y-6">
      <header className="studio-page-head">
        <div className="studio-page-title-row">
          <h1 className="font-display">{t.student.workTitle}</h1>
          {nextPiece ? (
            <Link href={`/student/work/${nextPiece.code}`} className="btn submit-jump">
              {t.student.submitVideo}
            </Link>
          ) : null}
        </div>
        <p className="page-meta">{t.student.countAssigned.replace("{n}", String(assigned.length))}</p>
      </header>

      {assigned.length === 0 ? (
        <p className="text-ink-soft">{t.student.noWork}</p>
      ) : (
        [...grouped.entries()].map(([key, rows]) => {
          const heading = rows[0]?.class?.name ?? t.student.assignedPieces;
          const teacher = rows[0]?.piece?.teacher?.name;
          return (
            <section key={key} className="studio-panel">
              <h2>{heading}</h2>
              {teacher ? (
                <p className="page-meta">
                  {t.student.teacherLabel}: {teacher}
                </p>
              ) : null}
              <table className="studio-table mt-2">
                <thead>
                  <tr>
                    <th>{t.student.thisPiece}</th>
                    <th>{t.student.due}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link href={`/student/work/${row.piece!.code}`} className="font-semibold">
                          {row.piece!.title}
                        </Link>
                        {row.goal ? <p className="text-xs text-ink-soft">{row.goal}</p> : null}
                      </td>
                      <td className="text-sm text-ink-soft">
                        {row.dueAt ? formatDueLabel(row.dueAt, locale) : "—"}
                      </td>
                      <td>
                        <Link href={`/student/work/${row.piece!.code}`} className="btn">
                          {t.student.submitPiece}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })
      )}
    </div>
  );
}
