-- CreateEnum
CREATE TYPE "AgeBand" AS ENUM ('under18', 'adult');
CREATE TYPE "ContactType" AS ENUM ('zalo', 'messenger');
CREATE TYPE "DeliveryType" AS ENUM ('zalo', 'messenger');
CREATE TYPE "VoiceSampleSource" AS ENUM ('pasted', 'curated_from_reply');
CREATE TYPE "MediaKind" AS ENUM ('video', 'audio', 'image', 'tab');
CREATE TYPE "SubmissionStatus" AS ENUM ('new', 'drafted', 'answered', 'skipped');
CREATE TYPE "ReplySource" AS ENUM ('approved_draft', 'edited_draft', 'manual');
CREATE TYPE "ActorType" AS ENUM ('teacher', 'student', 'admin', 'system');
CREATE TYPE "JobType" AS ENUM ('analyze', 'draft', 'perceive_audio', 'perceive_video');
CREATE TYPE "JobStatus" AS ENUM ('pending', 'running', 'done', 'failed');
CREATE TYPE "SubmissionRoute" AS ENUM ('teacher', 'ai_direct');

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "deliveryType" "DeliveryType",
    "deliveryHandle" TEXT,
    "inviteToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceSample" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "source" "VoiceSampleSource" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoiceSample_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Piece" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "referenceMediaId" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "aiDirectUnlockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Piece_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ageBand" "AgeBand" NOT NULL,
    "contactType" "ContactType" NOT NULL,
    "contactHandle" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "publicOk" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "durationS" DOUBLE PRECISION,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'new',
    "skipReason" TEXT,
    "reviewOpenedAt" TIMESTAMP(3),
    "teacherPick" BOOLEAN NOT NULL DEFAULT false,
    "route" "SubmissionRoute" NOT NULL DEFAULT 'teacher',
    "confidence" DOUBLE PRECISION,
    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "pipelineVersion" TEXT NOT NULL,
    "metricsJson" JSONB NOT NULL,
    "observationsJson" JSONB,
    "costCents" INTEGER,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Draft" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Draft_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reply" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "source" "ReplySource" NOT NULL,
    "editDistance" INTEGER,
    "teacherPick" BOOLEAN NOT NULL DEFAULT false,
    "openedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reply_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "teacherId" TEXT,
    "name" TEXT NOT NULL,
    "propsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "submissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Teacher_inviteToken_key" ON "Teacher"("inviteToken");
CREATE UNIQUE INDEX "Piece_code_key" ON "Piece"("code");
CREATE UNIQUE INDEX "Student_token_key" ON "Student"("token");

CREATE INDEX "VoiceSample_teacherId_active_idx" ON "VoiceSample"("teacherId", "active");
CREATE INDEX "Piece_teacherId_archived_idx" ON "Piece"("teacherId", "archived");
CREATE INDEX "Student_teacherId_approvedAt_idx" ON "Student"("teacherId", "approvedAt");
CREATE INDEX "Submission_pieceId_status_submittedAt_idx" ON "Submission"("pieceId", "status", "submittedAt");
CREATE INDEX "Submission_studentId_submittedAt_idx" ON "Submission"("studentId", "submittedAt");
CREATE INDEX "Submission_status_submittedAt_idx" ON "Submission"("status", "submittedAt");
CREATE INDEX "Analysis_submissionId_idx" ON "Analysis"("submissionId");
CREATE INDEX "Draft_submissionId_createdAt_idx" ON "Draft"("submissionId", "createdAt");
CREATE INDEX "Reply_teacherId_sentAt_idx" ON "Reply"("teacherId", "sentAt");
CREATE INDEX "Reply_submissionId_createdAt_idx" ON "Reply"("submissionId", "createdAt");
CREATE INDEX "Event_teacherId_name_createdAt_idx" ON "Event"("teacherId", "name", "createdAt");
CREATE INDEX "Event_name_createdAt_idx" ON "Event"("name", "createdAt");
CREATE INDEX "Job_status_createdAt_idx" ON "Job"("status", "createdAt");
CREATE INDEX "Job_type_status_idx" ON "Job"("type", "status");

ALTER TABLE "VoiceSample" ADD CONSTRAINT "VoiceSample_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Piece" ADD CONSTRAINT "Piece_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Piece" ADD CONSTRAINT "Piece_referenceMediaId_fkey" FOREIGN KEY ("referenceMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Minors never appear on walls, regardless of the checkbox.
ALTER TABLE "Student" ADD CONSTRAINT "student_minor_not_public"
  CHECK ("ageBand" <> 'under18' OR "publicOk" = false);

-- Drafts and replies are append-only at the application layer.
-- No updatedAt on Draft/Reply by design.
