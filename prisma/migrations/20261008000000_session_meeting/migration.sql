ALTER TABLE "ClassSession" ADD COLUMN "meetingProvider" TEXT;
ALTER TABLE "ClassSession" ADD COLUMN "meetingUrl" TEXT;
ALTER TABLE "ClassSession" ADD COLUMN "seriesId" TEXT;
CREATE INDEX "ClassSession_seriesId_idx" ON "ClassSession"("seriesId");
