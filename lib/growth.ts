/**
 * Growth hooks — v1 does not unlock these. Call sites should keep using
 * teacherId-scoped queries. New layers add migrations + job types, not a new app.
 *
 * v2 modules/cohorts: add Module, Cohort tables; Piece.moduleId; Student.cohortId
 * v2 wall: query Submission where teacherPick and Student.publicOk and ageBand=adult
 * v2 AI-direct: Piece.aiDirectUnlockedAt + Submission.route/confidence
 * v3 perception: JobType perceive_audio | perceive_video; Analysis.observationsJson
 * v3 school: Org model; storage region on Org
 */

export function shouldUnlockAiDirect(input: {
  repliesOnPiece: number;
  approveUntouchedLast50: number;
}) {
  return input.repliesOnPiece >= 100 && input.approveUntouchedLast50 >= 0.8;
}

export function routeSubmission(input: {
  aiDirectUnlockedAt: Date | null;
  confidence: number | null;
}) {
  if (!input.aiDirectUnlockedAt) return "teacher" as const;
  if (input.confidence == null || input.confidence < 0.8) return "teacher" as const;
  return "ai_direct" as const;
}

export function wallVisible(input: { publicOk: boolean; ageBand: "under18" | "adult"; teacherPick: boolean }) {
  if (input.ageBand === "under18") return false;
  return input.publicOk && input.teacherPick;
}
