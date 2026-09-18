-- AlterEnum
ALTER TYPE "MediaKind" ADD VALUE 'sheet';
ALTER TYPE "JobType" ADD VALUE 'train_piece';

-- CreateEnum
CREATE TYPE "PieceModelStatus" AS ENUM ('training', 'ready', 'failed');

-- AlterTable
ALTER TABLE "Piece" ADD COLUMN "sheetMediaId" TEXT;
ALTER TABLE "Piece" ADD COLUMN "tutorialMediaId" TEXT;

-- CreateTable
CREATE TABLE "PieceModel" (
    "id" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "PieceModelStatus" NOT NULL,
    "scoreJson" JSONB NOT NULL,
    "tutorialCuesJson" JSONB NOT NULL,
    "sourceJson" JSONB NOT NULL,
    "geminiModel" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "error" TEXT,
    "trainedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PieceModel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PieceModel_pieceId_version_key" ON "PieceModel"("pieceId", "version");
CREATE INDEX "PieceModel_pieceId_status_version_idx" ON "PieceModel"("pieceId", "status", "version");

ALTER TABLE "Piece" ADD CONSTRAINT "Piece_sheetMediaId_fkey" FOREIGN KEY ("sheetMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Piece" ADD CONSTRAINT "Piece_tutorialMediaId_fkey" FOREIGN KEY ("tutorialMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PieceModel" ADD CONSTRAINT "PieceModel_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE CASCADE ON UPDATE CASCADE;
