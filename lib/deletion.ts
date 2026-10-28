import { prisma } from "@/lib/prisma";
import { removeMedia, supabaseAdmin } from "@/lib/storage";
import { logEvent } from "@/lib/events";
import { isOwnTakeMedia } from "@/lib/take-media";

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

/** Keep the file when another take uses it, or when it is not this student's own upload. */
export function shouldKeepTakeFile(input: {
  mediaId: string;
  storagePath: string;
  otherSubmissionCount: number;
  teacherId: string;
  pieceId: string;
  studentId: string;
  piece: {
    sheetMediaId: string | null;
    tutorialMediaId: string | null;
    clipMediaId: string | null;
    referenceMediaId: string | null;
  };
}) {
  return (
    takeMediaIsShared({
      mediaId: input.mediaId,
      otherSubmissionCount: input.otherSubmissionCount,
      piece: input.piece,
    }) ||
    !isOwnTakeMedia(input.storagePath, {
      teacherId: input.teacherId,
      pieceId: input.pieceId,
      studentId: input.studentId,
    })
  );
}

async function deleteStored(path: string) {
  try {
    await removeMedia(path);
  } catch {
    // The file may already be gone.
  }
}

async function deleteAuthUser(authUserId: string | null | undefined) {
  if (!authUserId) return;
  const { error } = await supabaseAdmin().auth.admin.deleteUser(authUserId);
  if (error && !/not found/i.test(error.message)) throw error;
}

/**
 * Removes the student, their recordings, and their sign-in.
 * No user row is kept.
 */
export async function deleteStudentData(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      submissions: { include: { media: true, piece: true } },
    },
  });
  if (!student) throw new Error("student not found");

  const dropMedia: string[] = [];
  for (const submission of student.submissions) {
    const otherSubmissionCount = await prisma.submission.count({
      where: { mediaId: submission.mediaId, id: { not: submission.id } },
    });
    const keep = shouldKeepTakeFile({
      mediaId: submission.mediaId,
      storagePath: submission.media.storagePath,
      otherSubmissionCount,
      teacherId: submission.piece.teacherId,
      pieceId: submission.pieceId,
      studentId: submission.studentId,
      piece: submission.piece,
    });
    await deleteStored(`derived/${submission.id}/audio.wav`);
    if (!keep) {
      await deleteStored(submission.media.storagePath);
      dropMedia.push(submission.mediaId);
    }
  }

  await prisma.job.deleteMany({
    where: { submissionId: { in: student.submissions.map((submission) => submission.id) } },
  });
  await prisma.event.deleteMany({ where: { actorId: student.id } });
  await deleteAuthUser(student.authUserId);
  await prisma.student.delete({ where: { id: student.id } });
  if (dropMedia.length > 0) {
    await prisma.media.deleteMany({ where: { id: { in: dropMedia } } });
  }
}

/**
 * Removes the teacher and their studio. Student accounts are detached, not deleted.
 * No teacher user row is kept.
 */
export async function deleteTeacherAccount(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      pieces: {
        include: {
          submissions: { include: { media: true } },
          referenceMedia: true,
          sheetMedia: true,
          tutorialMedia: true,
          clipMedia: true,
        },
      },
    },
  });
  if (!teacher) throw new Error("teacher not found");

  const mediaIds = new Set<string>();
  const submissionIds: string[] = [];
  for (const piece of teacher.pieces) {
    for (const media of [piece.referenceMedia, piece.sheetMedia, piece.tutorialMedia, piece.clipMedia]) {
      if (!media) continue;
      mediaIds.add(media.id);
      await deleteStored(media.storagePath);
    }
    for (const submission of piece.submissions) {
      submissionIds.push(submission.id);
      mediaIds.add(submission.mediaId);
      await deleteStored(submission.media.storagePath);
      await deleteStored(`derived/${submission.id}/audio.wav`);
    }
  }

  await prisma.job.deleteMany({ where: { submissionId: { in: submissionIds } } });
  await prisma.student.updateMany({ where: { teacherId }, data: { teacherId: null } });
  await prisma.event.deleteMany({
    where: { OR: [{ teacherId }, { actorId: teacherId }] },
  });
  await deleteAuthUser(teacher.authUserId);
  await prisma.teacher.delete({ where: { id: teacherId } });
  if (mediaIds.size > 0) {
    await prisma.media.deleteMany({ where: { id: { in: [...mediaIds] } } });
  }
}

type DroppableTake = {
  id: string;
  pieceId: string;
  studentId: string;
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

/** Drop the take, its jobs, and the video unless the file is shared or not this student's upload. */
async function dropTake(submission: DroppableTake) {
  const otherSubmissionCount = await prisma.submission.count({
    where: { mediaId: submission.mediaId, id: { not: submission.id } },
  });
  const shared = shouldKeepTakeFile({
    mediaId: submission.mediaId,
    storagePath: submission.media.storagePath,
    otherSubmissionCount,
    teacherId: submission.piece.teacherId,
    pieceId: submission.pieceId,
    studentId: submission.studentId,
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
