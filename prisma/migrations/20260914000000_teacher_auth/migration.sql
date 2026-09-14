-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN "email" TEXT;
ALTER TABLE "Teacher" ADD COLUMN "authUserId" TEXT;
CREATE UNIQUE INDEX "Teacher_authUserId_key" ON "Teacher"("authUserId");
