import { prisma } from "@/lib/prisma";
import { removeMedia } from "@/lib/storage";
import { logEvent } from "@/lib/events";

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
      publicOk: false,
      approvedAt: null,
    },
  });

  await logEvent({
    name: "student.deleted",
    actorType: "admin",
    teacherId: student.teacherId,
    actorId: studentId,
    props: { keptAnalyses: true },
  });
}
