import { notFound } from "next/navigation";
import { studentForPiece } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canSubmitPiece } from "@/lib/demo-piece";
import { assignmentForStudentPiece } from "@/lib/lms";
import { mediaStoragePath, sheetView, signedMediaUrl } from "@/lib/media-view";
import { parseSheetSync } from "@/lib/score-model";

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
      demo: true,
      teacherId: true,
      teacher: { select: { name: true } },
      sheetMedia: { select: { storagePath: true } },
      tutorialMedia: { select: { storagePath: true } },
      referenceMedia: { select: { storagePath: true } },
      clipMedia: { select: { storagePath: true } },
    },
  });
  if (!piece || piece.archived) notFound();

  const bound = await studentForPiece(piece.teacherId, { demo: piece.demo });
  const student = bound.student;
  const assigned =
    student && !bound.otherClass
      ? await assignmentForStudentPiece({
          studentId: student.id,
          teacherId: piece.teacherId,
          pieceId: piece.id,
        })
      : null;
  const member = student && !bound.otherClass ? Boolean(assigned) : false;
  const needsProfile = !student;
  const canSubmit = canSubmitPiece({
    demo: piece.demo,
    otherClass: bound.otherClass,
    needsProfile,
    member,
  });

  const tutorialPath =
    mediaStoragePath(piece.tutorialMedia) ?? mediaStoragePath(piece.referenceMedia);
  const sheetPath = mediaStoragePath(piece.sheetMedia);
  const clipPath = mediaStoragePath(piece.clipMedia);
  const [tutorialUrl, sheetUrl, clipUrl, readyModel] = await Promise.all([
    signedMediaUrl(tutorialPath),
    signedMediaUrl(sheetPath),
    signedMediaUrl(clipPath),
    prisma.pieceModel.findFirst({
      where: { pieceId: piece.id, status: "ready" },
      orderBy: { version: "desc" },
      select: { sheetSyncJson: true },
    }),
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
    sheetSync: parseSheetSync(readyModel?.sheetSyncJson),
  };
}
