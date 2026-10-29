-- Demo songs are open to every student and are not a studio assignment.
ALTER TABLE "Piece" ADD COLUMN "demo" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Piece_demo_archived_idx" ON "Piece"("demo", "archived");
