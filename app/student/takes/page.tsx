import Link from "next/link";
import { redirect } from "next/navigation";
import { readStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { formatWhen } from "@/lib/when";

export default async function StudentTakesPage() {
  const student = await readStudentSession();
  if (!student) redirect("/auth?role=student");
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
      replies: { orderBy: { sentAt: "desc" }, take: 1, select: { id: true, text: true } },
    },
  });

  const kindLabel = {
    take: t.student.kindTake,
    practice: t.student.kindPractice,
    overdub: t.student.kindOverdub,
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl">{t.student.takesTitle}</h1>

      {takes.length === 0 ? (
        <section className="tile">
          <p className="tile-title">{t.student.noTakes}</p>
          <p className="mt-2 text-ink-soft">{t.student.stageInClassHelp}</p>
        </section>
      ) : (
        <div className="tile-grid">
          {takes.map((row) => {
            const reply = row.replies[0];
            return (
              <article key={row.id} className="tile">
                <Link href={`/student/work/${row.piece.code}`} className="tile-title hover:text-beat">
                  {row.piece.title}
                </Link>
                <p className="tile-meta">
                  <span>{kindLabel[row.kind]}</span>
                  <span>
                    {row.kind === "practice"
                      ? t.student.practiceLogged
                      : reply
                        ? t.student.replied
                        : t.student.waitingReply}
                  </span>
                  <span className="tabular">{formatWhen(row.submittedAt, locale)}</span>
                </p>
                {reply ? <p className="mt-3 leading-relaxed">{reply.text}</p> : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
