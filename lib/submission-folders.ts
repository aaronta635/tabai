import { isClaimableStatus } from "@/lib/forms";

export type FolderTake = {
  id: string;
  submittedAt: Date;
  status: string;
  kind: string;
  studentId: string;
  studentName: string;
  approved: boolean;
  pieceId: string;
  pieceTitle: string;
  classId: string | null;
  className: string | null;
};

export type PieceFolder = {
  pieceId: string;
  pieceTitle: string;
  waiting: number;
  takes: FolderTake[];
};

export type ClassFolder = {
  classId: string | null;
  className: string;
  waiting: number;
  pieces: PieceFolder[];
};

export function classForTake(input: {
  membershipClass?: { id: string; name: string } | null;
  assignmentClass?: { id: string; name: string } | null;
}) {
  return input.membershipClass ?? input.assignmentClass ?? null;
}

function sortTakes(a: FolderTake, b: FolderTake) {
  const wait = Number(isClaimableStatus(b.status)) - Number(isClaimableStatus(a.status));
  if (wait !== 0) return wait;
  return b.submittedAt.getTime() - a.submittedAt.getTime();
}

/** File takes by class, then piece — the teacher's cabinet, not a flat log. */
export function groupTakesByClassThenPiece(takes: FolderTake[], unassignedLabel: string): ClassFolder[] {
  const classes = new Map<string, ClassFolder>();

  for (const take of takes) {
    const classId = take.classId ?? "";
    const className = take.className ?? unassignedLabel;
    let cabinet = classes.get(classId);
    if (!cabinet) {
      cabinet = { classId: take.classId, className, waiting: 0, pieces: [] };
      classes.set(classId, cabinet);
    }
    let sleeve = cabinet.pieces.find((piece) => piece.pieceId === take.pieceId);
    if (!sleeve) {
      sleeve = { pieceId: take.pieceId, pieceTitle: take.pieceTitle, waiting: 0, takes: [] };
      cabinet.pieces.push(sleeve);
    }
    sleeve.takes.push(take);
    if (isClaimableStatus(take.status)) {
      sleeve.waiting += 1;
      cabinet.waiting += 1;
    }
  }

  for (const cabinet of classes.values()) {
    for (const sleeve of cabinet.pieces) {
      sleeve.takes.sort(sortTakes);
    }
    cabinet.pieces.sort((a, b) => b.waiting - a.waiting || a.pieceTitle.localeCompare(b.pieceTitle));
  }

  return [...classes.values()].sort((a, b) => {
    if (!a.classId && b.classId) return 1;
    if (a.classId && !b.classId) return -1;
    return b.waiting - a.waiting || a.className.localeCompare(b.className);
  });
}
