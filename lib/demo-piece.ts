/** A demo song is open practice. It must not pull the student into that piece's studio. */
export function canSubmitPiece(input: {
  demo: boolean;
  otherClass: boolean;
  needsProfile: boolean;
  member: boolean;
}) {
  if (input.demo) return true;
  return !input.otherClass && (input.needsProfile || input.member);
}

export function shouldAttachTeacher(demo: boolean, teacherId: string | null | undefined) {
  return !demo && !teacherId;
}

/** Demo takes are scored for a mock, even when the student has not been approved into a studio. */
export function analyzeAllowed(demo: boolean, approvedAt: Date | null | undefined) {
  return demo || approvedAt != null;
}
