-- CreateEnum
CREATE TYPE "SubmissionKind" AS ENUM ('take', 'practice', 'overdub');

-- AlterTable
ALTER TABLE "Piece"
ADD COLUMN "clipMediaId" TEXT,
ADD COLUMN "goal" TEXT,
ADD COLUMN "dueAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Submission"
ADD COLUMN "kind" "SubmissionKind" NOT NULL DEFAULT 'take';

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "seconds" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PracticeSession_studentId_startedAt_idx" ON "PracticeSession"("studentId", "startedAt");
CREATE INDEX "PracticeSession_pieceId_startedAt_idx" ON "PracticeSession"("pieceId", "startedAt");
CREATE INDEX "Submission_pieceId_kind_submittedAt_idx" ON "Submission"("pieceId", "kind", "submittedAt");

ALTER TABLE "Piece" ADD CONSTRAINT "Piece_clipMediaId_fkey" FOREIGN KEY ("clipMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE CASCADE ON UPDATE CASCADE;
