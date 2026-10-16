import Link from "next/link";
import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { formatDuration, formatWhen } from "@/lib/when";

export default async function StudentTakesPage() {
  const student = await readStudentSession();
  if (!student) redirect(signInPath("student", "/student"));
  const locale = await getLocale();
  const t = await getMessages(locale);
  const takes = await prisma.submission.findMany({
    where: { studentId: student.id },
    orderBy: { submittedAt: "desc" },
    take: 60,
    select: {
      id: true,
      kind: true,
      status: true,
      submittedAt: true,
      piece: { select: { title: true, code: true } },
      media: { select: { durationS: true } },
      replies: { orderBy: { sentAt: "desc" }, take: 1, select: { id: true, text: true } },
    },
  });

  const kindLabel = {
    take: t.student.kindTake,
    practice: t.student.kindPractice,
    overdub: t.student.kindOverdub,
  };
  const waiting = takes.filter(
    (row) => row.kind !== "practice" && !row.replies[0],
  ).length;
  const answered = takes.filter((row) => row.replies[0]).length;
  const practice = takes.filter((row) => row.kind === "practice").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display">{t.student.takesTitle}</h1>
        <p className="page-meta">
          {t.student.takesMeta
            .replace("{waiting}", String(waiting))
            .replace("{answered}", String(answered))}
          {practice > 0 ? ` · ${practice} ${t.student.kindPractice}` : ""}
        </p>
      </header>

      {takes.length === 0 ? (
        <p className="text-ink-soft">{t.student.noTakes}</p>
      ) : (
        <section className="studio-panel">
          <table className="studio-table is-dense">
            <thead>
              <tr>
                <th>{t.student.thisPiece}</th>
                <th>{t.student.colWhen}</th>
                <th>{t.student.colStatus}</th>
              </tr>
            </thead>
            <tbody>
              {takes.map((row) => {
                const reply = row.replies[0];
                const waitingRow = row.kind !== "practice" && !reply;
                const status =
                  row.kind === "practice"
                    ? t.student.practiceLogged
                    : reply
                      ? t.student.replied
                      : t.student.waitingReply;
                return (
                  <tr key={row.id}>
                    <td>
                      <Link href={`/student/takes/${row.id}`} className="row-hit">
                        {row.piece.title}
                      </Link>
                      <p className="text-xs text-ink-soft">
                        {[kindLabel[row.kind], formatDuration(row.media.durationS)].filter(Boolean).join(" · ")}
                      </p>
                      {reply ? <p className="line-clamp">{reply.text}</p> : null}
                    </td>
                    <td className="whitespace-nowrap text-sm text-ink-soft">
                      {formatWhen(row.submittedAt, locale)}
                    </td>
                    <td>
                      <span className={`status-chip${waitingRow ? "" : " is-quiet"}`}>{status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

