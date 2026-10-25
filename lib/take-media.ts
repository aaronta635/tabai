type TakeOwner = { teacherId: string; pieceId: string; studentId: string };

export function studentTakeFolder(owner: TakeOwner) {
  return `teachers/${owner.teacherId}/pieces/${owner.pieceId}/students/${owner.studentId}/`;
}

/** Piece sheets/tutorials and other students' takes live outside this folder. */
export function isOwnTakeMedia(storagePath: string, owner: TakeOwner) {
  return storagePath.startsWith(studentTakeFolder(owner));
}
