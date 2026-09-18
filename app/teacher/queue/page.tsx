import { redirect } from "next/navigation";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QueueClient, type QueueItem } from "@/components/teacher/queue-client";
import { getLocale, getMessages } from "@/lib/i18n";
import { nudgeHref } from "@/lib/deep-links";
import { observationMarkers } from "@/lib/score-model";
import { teacherNavCounts } from "@/lib/teacher-stats";

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const teacher = await readTeacherSession();
  if (!teacher) redirect("/");
  const { tab } = await searchParams;
  const current = tab === "pending" || tab === "answered" ? tab : "unanswered";
  const locale = await getLocale();
  const t = await getMessages(locale);

  const countsPromise = teacherNavCounts(teacher.id);

  let items: QueueItem[] = [];

  if (current === "pending") {
    const [counts, students] = await Promise.all([
      countsPromise,
      prisma.student.findMany({
        where: { teacherId: teacher.id, approvedAt: null, name: { not: "anonymised" } },
        include: {
          submissions: {
            include: { piece: true },
            orderBy: { submittedAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    items = students.flatMap((student) =>
      (student.submissions.length ? student.submissions : [null]).map((submission) => ({
        id: submission?.id ?? `student-${student.id}`,
        kind: "pending" as const,
        studentId: student.id,
        studentName: student.name,
        pieceTitle: submission?.piece.title ?? "—",
        waitingMs: Date.now() - student.createdAt.getTime(),
        mediaId: submission?.mediaId ?? null,
        draft: null,
        reply: null,
        teacherPick: false,
        skipReason: null,
        nudgeUrl: nudgeHref(student.contactType, student.contactHandle),
        submissionId: submission?.id ?? null,
        markers: [],
      })),
    );
    return (
      <div>
        <div className="mb-6">
          <p className="text-xs tracking-[0.18em] uppercase text-ink-soft">{t.teacher.navQueue}</p>
          <h1 className="font-display mt-2 text-3xl">{t.teacher.queue}</h1>
        </div>
        <QueueClient
          tab={current}
          labels={{
            unanswered: t.teacher.unanswered,
            pending: t.teacher.pending,
            answered: t.teacher.answered,
          }}
          counts={counts}
          items={items}
        />
      </div>
    );
  }

  const status = current === "answered" ? ["answered"] : ["new", "drafted"];
  const [counts, rows] = await Promise.all([
    countsPromise,
    prisma.submission.findMany({
      where: {
        piece: { teacherId: teacher.id },
        status: { in: status as ("new" | "drafted" | "answered")[] },
        student: current === "unanswered" ? { approvedAt: { not: null } } : undefined,
      },
      include: {
        student: true,
        piece: true,
        drafts: { orderBy: { createdAt: "desc" }, take: 1 },
        replies: { orderBy: { createdAt: "desc" }, take: 1 },
        analyses: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { submittedAt: "asc" },
    }),
  ]);
  items = rows.map((row) => ({
    id: row.id,
    kind: current === "answered" ? ("answered" as const) : ("unanswered" as const),
    studentId: row.studentId,
    studentName: row.student.name,
    pieceTitle: row.piece.title,
    waitingMs: Date.now() - row.submittedAt.getTime(),
    mediaId: row.mediaId,
    draft: row.drafts[0]?.text ?? null,
    reply: row.replies[0]?.text ?? null,
    teacherPick: row.teacherPick,
    skipReason: row.skipReason,
    nudgeUrl: nudgeHref(row.student.contactType, row.student.contactHandle),
    submissionId: row.id,
    markers: observationMarkers(row.analyses[0]?.observationsJson),
  }));

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs tracking-[0.18em] uppercase text-ink-soft">{t.teacher.navQueue}</p>
        <h1 className="font-display mt-2 text-3xl">{t.teacher.queue}</h1>
      </div>
      <QueueClient
        tab={current}
        labels={{
          unanswered: t.teacher.unanswered,
          pending: t.teacher.pending,
          answered: t.teacher.answered,
        }}
        counts={counts}
        items={items}
      />
    </div>
  );
}
