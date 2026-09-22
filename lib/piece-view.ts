import { notFound } from "next/navigation";
import { studentForPiece } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignmentForStudentPiece } from "@/lib/lms";
import { mediaStoragePath, sheetView, signedMediaUrl } from "@/lib/media-view";

export async function loadPieceClassroom(code: string) {
  const piece = await prisma.piece.findUnique({
    where: { code },
    select: {
      id: true,
      title: true,
      note: true,
      description: true,
      tips: true,
      goal: true,
      dueAt: true,
      archived: true,
      teacherId: true,
      teacher: { select: { name: true } },
      sheetMedia: { select: { storagePath: true } },
      tutorialMedia: { select: { storagePath: true } },
      referenceMedia: { select: { storagePath: true } },
      clipMedia: { select: { storagePath: true } },
    },
  });
  if (!piece || piece.archived) notFound();

  const bound = await studentForPiece(piece.teacherId);
  const student = bound.student;
  const assigned =
    student && !bound.otherClass
      ? await assignmentForStudentPiece({
          studentId: student.id,
          teacherId: piece.teacherId,
          pieceId: piece.id,
        })
      : null;
  const member =
    student && !bound.otherClass
      ? Boolean(assigned) || student.teacherId === piece.teacherId
      : false;
  const needsProfile = !student;
  const canSubmit = !bound.otherClass && (needsProfile || member);

  const tutorialPath =
    mediaStoragePath(piece.tutorialMedia) ?? mediaStoragePath(piece.referenceMedia);
  const sheetPath = mediaStoragePath(piece.sheetMedia);
  const clipPath = mediaStoragePath(piece.clipMedia);
  const [tutorialUrl, sheetUrl, clipUrl] = await Promise.all([
    signedMediaUrl(tutorialPath),
    signedMediaUrl(sheetPath),
    signedMediaUrl(clipPath),
  ]);

  return {
    piece,
    bound,
    assigned,
    needsProfile,
    canSubmit,
    tutorialUrl,
    sheetUrl,
    clipUrl,
    sheetKind: sheetView(sheetPath ?? ""),
  };
}
