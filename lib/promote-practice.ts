import type { SubmissionKind } from "@prisma/client";
import { enqueueAnalyzeIfApproved } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { revalidateStudentHotPath } from "@/lib/student-cache";
import { pitchCheckTimedOut } from "@/lib/student-pitch";

export type PromotePracticeResult =
  | { ok: true; id: string; already: boolean; pieceCode: string }
  | { error: "not_found" | "analyze_open" };

function kindAlreadySent(kind: SubmissionKind) {
  switch (kind) {
    case "take":
    case "overdub":
      return true;
    case "practice":
      return false;
    default: {
      const never: never = kind;
      return never;
    }
  }
}

/** Reuse this practice clip as a take. Gemini runs on the next analyze. */
export async function promotePracticeToTake(input: { studentId: string; submissionId: string }): Promise<PromotePracticeResult> {
  const row = await prisma.submission.findFirst({
    where: { id: input.submissionId, studentId: input.studentId },
    select: {
      id: true,
      kind: true,
      submittedAt: true,
      piece: { select: { code: true } },
      jobs: {
        where: { type: "analyze" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true },
      },
    },
  });
  if (!row) return { error: "not_found" };
  if (kindAlreadySent(row.kind)) {
    return { ok: true, id: row.id, already: true, pieceCode: row.piece.code };
  }
  const jobStatus = row.jobs[0]?.status;
  if (
    (jobStatus === "pending" || jobStatus === "running") &&
    !pitchCheckTimedOut(row.submittedAt)
  ) {
    return { error: "analyze_open" };
  }
  const promoted = await prisma.submission.updateMany({
    where: { id: row.id, studentId: input.studentId, kind: "practice" },
    data: { kind: "take", submittedAt: new Date() },
  });
  if (promoted.count === 0) {
    const current = await prisma.submission.findFirst({
      where: { id: row.id, studentId: input.studentId },
      select: { kind: true, piece: { select: { code: true } } },
    });
    if (current && kindAlreadySent(current.kind)) {
      return { ok: true, id: row.id, already: true, pieceCode: current.piece.code };
    }
    return { error: "not_found" };
  }
  const analyzeStillOpen = jobStatus === "pending" || jobStatus === "running";
  if (!analyzeStillOpen) {
    await enqueueAnalyzeIfApproved(row.id);
  }
  revalidateStudentHotPath(input.studentId);
  return { ok: true, id: row.id, already: false, pieceCode: row.piece.code };
}
