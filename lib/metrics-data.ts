import { prisma } from "@/lib/prisma";

export async function teacherMetrics(teacherId: string) {
  const replies = await prisma.reply.findMany({
    where: { teacherId },
    select: {
      source: true,
      openedAt: true,
      sentAt: true,
      editDistance: true,
      submission: { select: { pieceId: true } },
    },
    orderBy: { sentAt: "asc" },
  });

  const withTime = replies.filter((r) => r.openedAt);
  const deltas = withTime.map((r) => r.sentAt.getTime() - r.openedAt!.getTime());
  const drafted = withTime.filter((r) => r.source !== "manual");
  const manual = withTime.filter((r) => r.source === "manual");
  const draftedDeltas = drafted.map((r) => r.sentAt.getTime() - r.openedAt!.getTime());
  const manualDeltas = manual.map((r) => r.sentAt.getTime() - r.openedAt!.getTime());

  const untouched = replies.filter((r) => r.source === "approved_draft").length;
  const submissions = await prisma.submission.count({
    where: { piece: { teacherId } },
  });
  const costs = await prisma.event.findMany({
    where: { teacherId, name: "draft.cost" },
    select: { propsJson: true },
  });
  const costCents = costs.reduce((sum, row) => {
    const props = row.propsJson as { costCents?: number };
    return sum + (props.costCents ?? 0);
  }, 0);

  return {
    teacherId,
    replies: replies.length,
    submissions,
    medianTimePerReplyMs: median(deltas),
    medianManualMs: median(manualDeltas),
    medianDraftedMs: median(draftedDeltas),
    approveUntouchedRate: replies.length ? untouched / replies.length : 0,
    costCents,
    costPerSubmissionCents: submissions ? costCents / submissions : 0,
  };
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

export async function deckExport() {
  const teachers = await prisma.teacher.findMany({ orderBy: { createdAt: "asc" } });
  const rows = await Promise.all(
    teachers.map(async (teacher) => ({
      teacher: { id: teacher.id, name: teacher.name },
      metrics: await teacherMetrics(teacher.id),
    })),
  );
  return {
    generatedAt: new Date().toISOString(),
    teachers: rows,
  };
}
