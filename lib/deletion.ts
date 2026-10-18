import { prisma } from "@/lib/prisma";
import { removeMedia } from "@/lib/storage";
import { logEvent } from "@/lib/events";

export function takeMediaIsShared(input: {
  mediaId: string;
  otherSubmissionCount: number;
  piece: {
    sheetMediaId: string | null;
    tutorialMediaId: string | null;
    clipMediaId: string | null;
    referenceMediaId: string | null;
  };
}) {
  if (input.otherSubmissionCount > 0) return true;
  const ids = [
    input.piece.sheetMediaId,
    input.piece.tutorialMediaId,
    input.piece.clipMediaId,
    input.piece.referenceMediaId,
  ];
  return ids.includes(input.mediaId);
}

/**
 * Admin deletion: strip identity and media, keep anonymised analysis metrics.
 * Drafts and replies are removed so the student's words/video cannot be reconstructed.
 */
export async function deleteStudentData(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      submissions: { include: { media: true, piece: true } },
    },
  });
  if (!student) throw new Error("student not found");

  for (const submission of student.submissions) {
    try {
      await removeMedia(submission.media.storagePath);
    } catch {
      // storage object may already be gone
    }
    await prisma.draft.deleteMany({ where: { submissionId: submission.id } });
    await prisma.reply.deleteMany({ where: { submissionId: submission.id } });
    await prisma.job.deleteMany({ where: { submissionId: submission.id } });
  }

  await prisma.student.update({
    where: { id: studentId },
    data: {
      name: "anonymised",
      contactHandle: "",
      token: `deleted_${studentId}`,
      reportToken: null,
      publicOk: false,
      approvedAt: null,
    },
  });

  await logEvent({
    name: "student.deleted",
    actorType: "admin",
    teacherId: student.teacherId ?? undefined,
    actorId: studentId,
    props: { keptAnalyses: true },
  });
}

type DroppableTake = {
  id: string;
  mediaId: string;
  media: { storagePath: string };
  piece: {
    teacherId: string;
    sheetMediaId: string | null;
    tutorialMediaId: string | null;
    clipMediaId: string | null;
    referenceMediaId: string | null;
  };
};

/** Drop the take, its jobs, and the video unless another piece still uses that file. */
async function dropTake(submission: DroppableTake) {
  const otherSubmissionCount = await prisma.submission.count({
    where: { mediaId: submission.mediaId, id: { not: submission.id } },
  });
  const shared = takeMediaIsShared({
    mediaId: submission.mediaId,
    otherSubmissionCount,
    piece: submission.piece,
  });

  await prisma.job.deleteMany({ where: { submissionId: submission.id } });
  await prisma.submission.delete({ where: { id: submission.id } });

  try {
    await removeMedia(`derived/${submission.id}/audio.wav`);
  } catch {
    // derivative is best-effort
  }

  if (!shared) {
    try {
      await removeMedia(submission.media.storagePath);
    } catch {
      // storage object may already be gone
    }
    await prisma.media.delete({ where: { id: submission.mediaId } }).catch(() => undefined);
  }

  return shared;
}

/** Teacher delete: drop the take, drafts, and video. Keep piece tutorials/sheets. */
export async function deleteTeacherTake(input: { teacherId: string; submissionId: string }) {
  const submission = await prisma.submission.findFirst({
    where: { id: input.submissionId, piece: { teacherId: input.teacherId } },
    include: { media: true, piece: true },
  });
  if (!submission) throw new Error("not found");
  const shared = await dropTake(submission);

  await logEvent({
    name: "submission.deleted",
    actorType: "teacher",
    actorId: input.teacherId,
    teacherId: input.teacherId,
    props: { submissionId: submission.id, sharedMedia: shared },
  });
}

/** Student delete: only their own take. Same media rules as the teacher delete. */
export async function deleteOwnTake(input: { studentId: string; submissionId: string }) {
  const submission = await prisma.submission.findFirst({
    where: { id: input.submissionId, studentId: input.studentId },
    include: { media: true, piece: true },
  });
  if (!submission) throw new Error("not found");
  const shared = await dropTake(submission);

  await logEvent({
    name: "submission.deleted",
    actorType: "student",
    actorId: input.studentId,
    teacherId: submission.piece.teacherId,
    props: { submissionId: submission.id, sharedMedia: shared },
  });
}
