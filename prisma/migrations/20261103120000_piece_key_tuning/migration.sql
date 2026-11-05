-- Teacher-set song key and guitar tuning. The assignment due date stays on Assignment.dueAt.
ALTER TABLE "Piece" ADD COLUMN "songKey" TEXT;
ALTER TABLE "Piece" ADD COLUMN "tuning" TEXT;
