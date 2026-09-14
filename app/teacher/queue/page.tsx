import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSignedReadUrl } from "@/lib/storage";
import { QueueClient, type QueueItem } from "@/components/teacher/queue-client";
import { getLocale, getMessages } from "@/lib/i18n";
import { nudgeHref } from "@/lib/deep-links";

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const teacher = await requireTeacher();
  if (!teacher) redirect("/");
  const { tab } = await searchParams;
  const current = tab === "pending" || tab === "answered" ? tab : "unanswered";
  const locale = await getLocale();
  const t = await getMessages(locale);

  const unansweredCount = await prisma.submission.count({
    where: {
      piece: { teacherId: teacher.id },
      student: { approvedAt: { not: null } },
      status: { in: ["new", "drafted"] },
    },
  });
  const pendingCount = await prisma.student.count({
    where: { teacherId: teacher.id, approvedAt: null, name: { not: "anonymised" } },
  });
  const answeredCount = await prisma.submission.count({
    where: { piece: { teacherId: teacher.id }, status: "answered" },
  });

  let items: QueueItem[] = [];

  if (current === "pending") {
    const students = await prisma.student.findMany({
      where: { teacherId: teacher.id, approvedAt: null, name: { not: "anonymised" } },
      include: {
        submissions: {
          include: { piece: true, media: true },
          orderBy: { submittedAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    items = await Promise.all(
      students.flatMap((student) =>
        (student.submissions.length ? student.submissions : [null]).map(async (submission) => {
          const url = submission
            ? await signedOrNull(submission.media.storagePath)
            : null;
          return {
            id: submission?.id ?? `student-${student.id}`,
            kind: "pending" as const,
            studentId: student.id,
            studentName: student.name,
            pieceTitle: submission?.piece.title ?? "—",
            waitingMs: Date.now() - student.createdAt.getTime(),
            videoUrl: url,
            draft: null,
            reply: null,
            teacherPick: false,
            skipReason: null,
            nudgeUrl: nudgeHref(student.contactType, student.contactHandle),
            submissionId: submission?.id ?? null,
          };
        }),
      ),
    );
  } else {
    const status = current === "answered" ? ["answered"] : ["new", "drafted"];
    const rows = await prisma.submission.findMany({
      where: {
        piece: { teacherId: teacher.id },
        status: { in: status as ("new" | "drafted" | "answered")[] },
        student: current === "unanswered" ? { approvedAt: { not: null } } : undefined,
      },
      include: {
        student: true,
        piece: true,
        media: true,
        drafts: { orderBy: { createdAt: "desc" }, take: 1 },
        replies: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { submittedAt: "asc" },
    });
    items = await Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        kind: current === "answered" ? ("answered" as const) : ("unanswered" as const),
        studentId: row.studentId,
        studentName: row.student.name,
        pieceTitle: row.piece.title,
        waitingMs: Date.now() - row.submittedAt.getTime(),
        videoUrl: await signedOrNull(row.media.storagePath),
        draft: row.drafts[0]?.text ?? null,
        reply: row.replies[0]?.text ?? null,
        teacherPick: row.teacherPick,
        skipReason: row.skipReason,
        nudgeUrl: nudgeHref(row.student.contactType, row.student.contactHandle),
        submissionId: row.id,
      })),
    );
  }

  return (
    <QueueClient
      tab={current}
      labels={{
        unanswered: t.teacher.unanswered,
        pending: t.teacher.pending,
        answered: t.teacher.answered,
      }}
      counts={{ unanswered: unansweredCount, pending: pendingCount, answered: answeredCount }}
      items={items}
    />
  );
}

async function signedOrNull(path: string) {
  if (!path || path === "pending") return null;
  try {
    return await createSignedReadUrl(path);
  } catch {
    return null;
  }
}
