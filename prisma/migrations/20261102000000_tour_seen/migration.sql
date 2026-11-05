ALTER TABLE "Teacher" ADD COLUMN "tourSeenAt" TIMESTAMP(3);
ALTER TABLE "Student" ADD COLUMN "tourSeenAt" TIMESTAMP(3);

-- Accounts that already exist have logged in before. Only a later signup starts the tour.
UPDATE "Teacher" SET "tourSeenAt" = CURRENT_TIMESTAMP WHERE "tourSeenAt" IS NULL;
UPDATE "Student" SET "tourSeenAt" = CURRENT_TIMESTAMP WHERE "tourSeenAt" IS NULL;
