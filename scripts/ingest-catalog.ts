import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  attachPieceAssets,
  CATALOG_DIR,
  enqueueTrainPiece,
  getReadyPieceModel,
  listCatalogSlots,
  sha256,
} from "../lib/catalog";
import { loadLocalEnv } from "../lib/load-env";
import { prisma } from "../lib/prisma";
import type { PieceModelSourceJson } from "../lib/score-model";

loadLocalEnv();

const retrain = process.argv.includes("--retrain");

async function findTeacherId() {
  if (process.env.CATALOG_TEACHER_ID) return process.env.CATALOG_TEACHER_ID;
  const teacher = await prisma.teacher.findFirst({ orderBy: { createdAt: "asc" } });
  return teacher?.id ?? null;
}

async function ingestSlug(
  slug: string,
  teacherId: string,
  meta: { title: string; code: string; note?: string; sheetName: string | null; tutorialName: string | null },
) {
  if (!meta.sheetName || !meta.tutorialName) {
    console.log("skip", slug, "— drop sheet.* and tutorial.* then re-run");
    return;
  }

  const dir = join(CATALOG_DIR, slug);
  const sheetBytes = await readFile(join(dir, meta.sheetName));
  const tutorialBytes = await readFile(join(dir, meta.tutorialName));
  const sheetSha = sha256(sheetBytes);
  const tutorialSha = sha256(tutorialBytes);

  let piece = await prisma.piece.findUnique({ where: { code: meta.code } });
  if (!piece) {
    piece = await prisma.piece.create({
      data: {
        teacherId,
        code: meta.code,
        title: meta.title,
        note: meta.note ?? "Chơi chậm, đúng nhịp.",
      },
    });
    console.log("created piece", meta.code, piece.id);
  } else {
    await prisma.piece.update({
      where: { id: piece.id },
      data: { title: meta.title, note: meta.note ?? piece.note },
    });
  }

  const ready = await getReadyPieceModel(piece.id);
  const source = (ready?.sourceJson ?? null) as PieceModelSourceJson | null;
  const unchanged =
    source?.sheetSha256 === sheetSha && source?.tutorialSha256 === tutorialSha && Boolean(ready);
  if (unchanged && !retrain) {
    console.log("skip train", slug, "— model already ready (pass --retrain to rebuild)");
    return;
  }

  await attachPieceAssets({
    pieceId: piece.id,
    sheet: { bytes: sheetBytes, filename: meta.sheetName },
    tutorial: { bytes: tutorialBytes, filename: meta.tutorialName },
    source: { catalogSlug: slug, sheetSha256: sheetSha, tutorialSha256: tutorialSha },
  });

  const job = await enqueueTrainPiece(piece.id, {
    catalogSlug: slug,
    sheetSha256: sheetSha,
    tutorialSha256: tutorialSha,
  });
  console.log("enqueued train_piece", slug, job.id);
}

async function main() {
  const teacherId = await findTeacherId();
  if (!teacherId) {
    console.error("No teacher found. Run `npm run db:seed` or set CATALOG_TEACHER_ID.");
    process.exit(1);
  }

  const slots = await listCatalogSlots();
  if (slots.length === 0) {
    console.log("catalog/ has no song folders");
    return;
  }

  for (const slot of slots) {
    await ingestSlug(slot.slug, teacherId, slot);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
