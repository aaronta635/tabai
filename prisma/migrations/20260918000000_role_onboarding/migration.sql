-- CreateEnum
CREATE TYPE "TutorStage" AS ENUM ('starting', 'collecting', 'running');

-- CreateEnum
CREATE TYPE "StudentStage" AS ENUM ('exploring', 'in_class');

-- AlterTable
ALTER TABLE "Teacher"
ADD COLUMN "stage" "TutorStage",
ADD COLUMN "answersJson" JSONB,
ADD COLUMN "onboardedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Student"
ADD COLUMN "email" TEXT,
ADD COLUMN "authUserId" TEXT,
ADD COLUMN "stage" "StudentStage",
ADD COLUMN "answersJson" JSONB,
ADD COLUMN "onboardedAt" TIMESTAMP(3);

ALTER TABLE "Student" ALTER COLUMN "teacherId" DROP NOT NULL;

CREATE UNIQUE INDEX "Student_authUserId_key" ON "Student"("authUserId");
