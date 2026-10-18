import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import type { MediaKind, Prisma } from "@prisma/client";
import { enqueueJob } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { downloadMedia, uploadMedia } from "@/lib/storage";
import type { PieceModelSourceJson } from "@/lib/score-model";

export const CATALOG_DIR = join(process.cwd(), "catalog");

export type CatalogMeta = {
  title: string;
  code: string;
  note?: string;
};

export type CatalogSlot = CatalogMeta & {
  slug: string;
  sheetName: string | null;
  tutorialName: string | null;
};

const SHEET_EXT = new Map<string, { mime: string; kind: MediaKind }>([
  [".pdf", { mime: "application/pdf", kind: "sheet" }],
  [".png", { mime: "image/png", kind: "sheet" }],
  [".jpg", { mime: "image/jpeg", kind: "sheet" }],
  [".jpeg", { mime: "image/jpeg", kind: "sheet" }],
  [".webp", { mime: "image/webp", kind: "sheet" }],
  [".musicxml", { mime: "application/xml", kind: "sheet" }],
  [".xml", { mime: "application/xml", kind: "sheet" }],
]);

const TUTORIAL_EXT = new Map<string, { mime: string; kind: MediaKind }>([
  [".mp4", { mime: "video/mp4", kind: "video" }],
  [".webm", { mime: "video/webm", kind: "video" }],
  [".mov", { mime: "video/quicktime", kind: "video" }],
  [".m4v", { mime: "video/mp4", kind: "video" }],
]);

export function sha256(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function sniffMime(bytes: Buffer, fallback: string) {
  if (bytes.slice(0, 4).toString("ascii") === "%PDF") return "application/pdf";
  if (bytes[0] === 0x89 && bytes.slice(1, 4).toString("ascii") === "PNG") return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes.slice(0, 4).toString("ascii") === "RIFF" && bytes.slice(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  const head = bytes.slice(0, 64).toString("ascii");
  if (head.includes("<?xml") || head.includes("<score-partwise") || head.includes("<score-timewise")) {
    return "application/xml";
  }
  if (bytes.slice(4, 8).toString("ascii") === "ftyp") return "video/mp4";
  if (bytes[0] === 0x1a && bytes[1] === 0x45) return "video/webm";
  return fallback;
}

export function sheetKindFromName(filename: string) {
  return SHEET_EXT.get(extname(filename).toLowerCase()) ?? null;
}

export function tutorialKindFromName(filename: string) {
  return TUTORIAL_EXT.get(extname(filename).toLowerCase()) ?? null;
}

export function isCatalogMeta(value: unknown): value is CatalogMeta {
  if (!value || typeof value !== "object") return false;
  const meta = value as Record<string, unknown>;
  return typeof meta.title === "string" && typeof meta.code === "string";
}

export async function listDropName(dir: string, prefixes: string[]) {
  const names = await readdir(dir).catch(() => [] as string[]);
  return (
    names.find((name) => {
      const lower = name.toLowerCase();
      return prefixes.some((prefix) => lower.startsWith(prefix) && !lower.endsWith(".json"));
    }) ?? null
  );
}

export async function listCatalogSlots(): Promise<CatalogSlot[]> {
  const entries = await readdir(CATALOG_DIR, { withFileTypes: true }).catch(() => []);
  const slugs = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const slots: CatalogSlot[] = [];
  for (const slug of slugs) {
    const dir = join(CATALOG_DIR, slug);
    const raw = await readFile(join(dir, "meta.json"), "utf8").catch(() => null);
    if (!raw) continue;
    const parsed = JSON.parse(raw) as unknown;
    if (!isCatalogMeta(parsed)) continue;
    slots.push({
      slug,
      title: parsed.title,
      code: parsed.code,
      note: parsed.note,
      sheetName: await listDropName(dir, ["sheet."]),
      tutorialName: await listDropName(dir, ["tutorial."]),
    });
  }
  return slots;
}

export async function readCatalogSlot(slug: string) {
  const slots = await listCatalogSlots();
  return slots.find((slot) => slot.slug === slug) ?? null;
}

export async function catalogSlugForCode(code: string) {
  const slots = await listCatalogSlots();
  return slots.find((slot) => slot.code === code)?.slug ?? null;
}

function catalogFilename(kind: "sheet" | "tutorial", sourceName: string) {
  const ext = extname(sourceName).toLowerCase() || (kind === "sheet" ? ".pdf" : ".mp4");
  return `${kind}${ext}`;
}

async function replaceDropFile(dir: string, prefix: "sheet." | "tutorial.", filename: string, bytes: Buffer) {
  const names = await readdir(dir).catch(() => [] as string[]);
  await Promise.all(
    names
      .filter((name) => name.toLowerCase().startsWith(prefix))
      .map((name) => unlink(join(dir, name)).catch(() => undefined)),
  );
  await writeFile(join(dir, filename), bytes);
}

export async function writeCatalogDrop(input: {
  slug: string;
  meta: CatalogMeta;
  sheet?: { bytes: Buffer; filename: string };
  tutorial?: { bytes: Buffer; filename: string };
}) {
  const dir = join(CATALOG_DIR, input.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, "meta.json"),
    `${JSON.stringify(
      {
        title: input.meta.title,
        code: input.meta.code,
        note: input.meta.note ?? "",
      },
      null,
      2,
    )}\n`,
  );
  if (input.sheet) {
    await replaceDropFile(dir, "sheet.", catalogFilename("sheet", input.sheet.filename), input.sheet.bytes);
  }
  if (input.tutorial) {
    await replaceDropFile(
      dir,
      "tutorial.",
      catalogFilename("tutorial", input.tutorial.filename),
      input.tutorial.bytes,
    );
  }
  return dir;
}

export async function syncPieceToCatalog(pieceId: string) {
  const piece = await prisma.piece.findUnique({
    where: { id: pieceId },
    include: { sheetMedia: true, tutorialMedia: true },
  });
  if (!piece) throw new Error("piece not found");

  const slug = (await catalogSlugForCode(piece.code)) ?? piece.code;
  const sheet =
    piece.sheetMedia && piece.sheetMedia.storagePath !== "pending"
      ? {
          bytes: await downloadMedia(piece.sheetMedia.storagePath),
          filename: catalogFilename("sheet", piece.sheetMedia.storagePath),
        }
      : undefined;
  const tutorial =
    piece.tutorialMedia && piece.tutorialMedia.storagePath !== "pending"
      ? {
          bytes: await downloadMedia(piece.tutorialMedia.storagePath),
          filename: catalogFilename("tutorial", piece.tutorialMedia.storagePath),
        }
      : undefined;

  await writeCatalogDrop({
    slug,
    meta: { title: piece.title, code: piece.code, note: piece.note ?? undefined },
    sheet,
    tutorial,
  });
  return slug;
}

export async function getReadyPieceModel(pieceId: string) {
  return prisma.pieceModel.findFirst({
    where: { pieceId, status: "ready" },
    orderBy: { version: "desc" },
  });
}

export async function attachPieceAssets(input: {
  pieceId: string;
  sheet?: { bytes: Buffer; filename: string };
  tutorial?: { bytes: Buffer; filename: string };
  source?: Partial<PieceModelSourceJson>;
}) {
  const piece = await prisma.piece.findUnique({ where: { id: input.pieceId } });
  if (!piece) throw new Error("piece not found");

  const data: Prisma.PieceUpdateInput = {};
  const hashes: Partial<PieceModelSourceJson> = { ...input.source };

  if (input.sheet) {
    const kind = sheetKindFromName(input.sheet.filename);
    if (!kind) throw new Error(`unsupported sheet file: ${input.sheet.filename}`);
    const media = await prisma.media.create({
      data: { kind: kind.kind, storagePath: "pending", sizeBytes: input.sheet.bytes.length },
    });
    const path = `teachers/${piece.teacherId}/pieces/${piece.id}/sheet/${media.id}${extname(input.sheet.filename).toLowerCase()}`;
    await uploadMedia(path, input.sheet.bytes, kind.mime);
    await prisma.media.update({ where: { id: media.id }, data: { storagePath: path } });
    data.sheetMedia = { connect: { id: media.id } };
    hashes.sheetMediaId = media.id;
    hashes.sheetSha256 = sha256(input.sheet.bytes);
    hashes.sheetMime = kind.mime;
  }

  if (input.tutorial) {
    const kind = tutorialKindFromName(input.tutorial.filename);
    if (!kind) throw new Error(`unsupported tutorial file: ${input.tutorial.filename}`);
    const media = await prisma.media.create({
      data: { kind: kind.kind, storagePath: "pending", sizeBytes: input.tutorial.bytes.length },
    });
    const path = `teachers/${piece.teacherId}/pieces/${piece.id}/tutorial/${media.id}${extname(input.tutorial.filename).toLowerCase()}`;
    await uploadMedia(path, input.tutorial.bytes, kind.mime);
    await prisma.media.update({ where: { id: media.id }, data: { storagePath: path } });
    data.tutorialMedia = { connect: { id: media.id } };
    data.referenceMedia = { connect: { id: media.id } };
    hashes.tutorialMediaId = media.id;
    hashes.tutorialSha256 = sha256(input.tutorial.bytes);
    hashes.tutorialMime = kind.mime;
  }

  if (Object.keys(data).length > 0) {
    await prisma.piece.update({ where: { id: piece.id }, data });
  }

  return prisma.piece.findUniqueOrThrow({
    where: { id: piece.id },
    include: { sheetMedia: true, tutorialMedia: true },
  }).then((updated) => ({ piece: updated, hashes }));
}

export async function linkPieceAssets(input: {
  pieceId: string;
  sheetMediaId?: string;
  tutorialMediaId?: string;
  clipMediaId?: string;
}) {
  const piece = await prisma.piece.findUnique({ where: { id: input.pieceId } });
  if (!piece) throw new Error("piece not found");

  const data: Prisma.PieceUpdateInput = {};
  if (input.sheetMediaId) {
    data.sheetMedia = { connect: { id: input.sheetMediaId } };
  }
  if (input.tutorialMediaId) {
    data.tutorialMedia = { connect: { id: input.tutorialMediaId } };
    data.referenceMedia = { connect: { id: input.tutorialMediaId } };
  }
  if (input.clipMediaId) {
    data.clipMedia = { connect: { id: input.clipMediaId } };
  }
  if (Object.keys(data).length === 0) {
    return prisma.piece.findUniqueOrThrow({
      where: { id: piece.id },
      include: { sheetMedia: true, tutorialMedia: true },
    });
  }

  return prisma.piece.update({
    where: { id: piece.id },
    data,
    include: { sheetMedia: true, tutorialMedia: true },
  });
}

export async function enqueueTrainPiece(pieceId: string, extras?: Partial<PieceModelSourceJson>) {
  const piece = await prisma.piece.findUnique({ where: { id: pieceId } });
  if (!piece) throw new Error("piece not found");
  if (!piece.sheetMediaId && !piece.tutorialMediaId) {
    throw new Error("piece needs a sheet or a tutorial before train");
  }
  return enqueueJob("train_piece", { pieceId, ...extras });
}

/** Train this piece if it has a sheet or tutorial, no ready model, and no train job already open. */
export async function enqueueTrainIfIdle(pieceId: string) {
  const piece = await prisma.piece.findUnique({
    where: { id: pieceId },
    select: { sheetMediaId: true, tutorialMediaId: true },
  });
  if (!piece) return null;
  if (!piece.sheetMediaId && !piece.tutorialMediaId) return null;
  if (await getReadyPieceModel(pieceId)) return null;
  const openJobs = await prisma.job.findMany({
    where: { type: "train_piece", status: { in: ["pending", "running"] } },
    select: { payload: true },
  });
  const alreadyQueued = openJobs.some((job) => {
    const payload = job.payload as { pieceId?: string } | null;
    return payload?.pieceId === pieceId;
  });
  if (alreadyQueued) return null;
  return enqueueTrainPiece(pieceId);
}

/** Enqueue train for pieces that have a sheet or tutorial but no ready model. */
export async function enqueueTrainForPiecesWithoutReadyModel() {
  const pieces = await prisma.piece.findMany({
    where: {
      archived: false,
      OR: [{ sheetMediaId: { not: null } }, { tutorialMediaId: { not: null } }],
      models: { none: { status: "ready" } },
    },
    select: { id: true, code: true, title: true },
  });
  const openJobs = await prisma.job.findMany({
    where: { type: "train_piece", status: { in: ["pending", "running"] } },
    select: { payload: true },
  });
  const openIds = new Set(
    openJobs
      .map((job) => {
        const payload = job.payload as { pieceId?: string } | null;
        return payload?.pieceId;
      })
      .filter((id): id is string => Boolean(id)),
  );
  const jobs = [];
  for (const piece of pieces) {
    if (openIds.has(piece.id)) continue;
    jobs.push({ piece, job: await enqueueTrainPiece(piece.id) });
  }
  return jobs;
}
