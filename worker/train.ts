import { ThinkingLevel } from "@google/genai";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Prisma } from "@prisma/client";
import { TRAIN_PROMPT_VERSION } from "../lib/constants";
import { sha256, sniffMime } from "../lib/catalog";
import {
  TRAIN_RESPONSE_SCHEMA,
  deleteGeminiFile,
  geminiClient,
  geminiCostCents,
  geminiTrainModel,
  generateGeminiJson,
  uploadGeminiFile,
  type GeminiFileRef,
} from "../lib/gemini";
import { prisma } from "../lib/prisma";
import {
  parseTrainExtract,
  splitTrainExtract,
  isThinTrainExtract,
  trainExtractRichness,
  type PieceModelSourceJson,
} from "../lib/score-model";
import { downloadMedia } from "../lib/storage";

async function loadPrompt(name: string) {
  return readFile(join(process.cwd(), "prompts", name), "utf8");
}

function trainUserText(input: {
  title: string;
  note: string | null;
  sheet: boolean;
  tutorial: boolean;
  strict?: boolean;
}) {
  const attached =
    input.sheet && input.tutorial
      ? "First file is the sheet. Second file is the tutorial video."
      : input.sheet
        ? "The attached file is the sheet. There is no tutorial video."
        : "The attached file is the tutorial video. There is no sheet.";
  const rules = [
    input.sheet
      ? "Fill the written score (key, time signature, bars, melodyNotes, chords) from the sheet. Do not invent bars that are not on the page."
      : "There is no sheet. Do not invent a full written score. barCount may be 0. sections may be empty or a rough outline only if the melody is clearly heard. Never dump a scale. Do not guess bar numbers.",
    input.tutorial
      ? "Fill tutorialCues (at least four timestamped cues), techniqueFocus, and commonMistakes from the tutor."
      : "There is no tutorial. tutorialCues may be []. Leave techniqueFocus and commonMistakes empty unless marked on the sheet.",
  ].join(" ");
  const lines = [
    `Piece title: ${input.title}`,
    input.note ? `Teacher note: ${input.note}` : "No teacher note.",
    attached,
    rules,
    "Extract the piece model JSON.",
  ];
  if (input.strict) {
    lines.push("Previous extract was too thin. Retry:");
    if (input.sheet) lines.push("- melodyNotes must be the written tune in order, never a scale. Fill sections from the page.");
    if (input.tutorial) {
      lines.push("- tutorialCues: at least four timestamped cues from the video.");
      lines.push("- Fill techniqueFocus and commonMistakes from the tutor.");
    }
    if (!input.sheet) lines.push("- Do not invent bars or a full score. Empty sections are OK.");
    if (!input.tutorial) lines.push("- Empty tutorialCues is OK. Do not invent video timestamps.");
  }
  return lines.join("\n");
}

export async function runTrainPiece(pieceId: string, extras?: Partial<PieceModelSourceJson>) {
  const piece = await prisma.piece.findUnique({
    where: { id: pieceId },
    include: { sheetMedia: true, tutorialMedia: true },
  });
  if (!piece) throw new Error("piece not found");
  if (!piece.sheetMedia && !piece.tutorialMedia) {
    throw new Error("piece needs a sheet or a tutorial before train");
  }

  const assets = { sheet: Boolean(piece.sheetMedia), tutorial: Boolean(piece.tutorialMedia) };
  const ai = geminiClient();
  if (!ai) throw new Error("GEMINI_API_KEY is not set");

  const last = await prisma.pieceModel.findFirst({
    where: { pieceId },
    orderBy: { version: "desc" },
  });
  const version = (last?.version ?? 0) + 1;
  const modelName = geminiTrainModel();
  const sourceJson: PieceModelSourceJson = {
    ...(piece.sheetMedia ? { sheetMediaId: piece.sheetMedia.id } : {}),
    ...(piece.tutorialMedia ? { tutorialMediaId: piece.tutorialMedia.id } : {}),
    ...extras,
  };

  const row = await prisma.pieceModel.create({
    data: {
      pieceId,
      version,
      status: "training",
      scoreJson: {},
      tutorialCuesJson: {},
      sourceJson: sourceJson as unknown as Prisma.InputJsonValue,
      geminiModel: modelName,
      promptVersion: TRAIN_PROMPT_VERSION,
    },
  });

  const uploaded: string[] = [];
  const files: GeminiFileRef[] = [];
  const started = Date.now();
  try {
    if (piece.sheetMedia) {
      const sheetBytes = await downloadMedia(piece.sheetMedia.storagePath);
      const sheetMime = sniffMime(sheetBytes, "application/pdf");
      const sheetFile = await uploadGeminiFile(ai, sheetBytes, sheetMime, `${piece.code}-sheet`);
      uploaded.push(sheetFile.name);
      files.push(sheetFile);
      sourceJson.sheetSha256 = sha256(sheetBytes);
      sourceJson.sheetMime = sheetMime;
    }
    if (piece.tutorialMedia) {
      const tutorialBytes = await downloadMedia(piece.tutorialMedia.storagePath);
      const tutorialMime = sniffMime(tutorialBytes, "video/mp4");
      const tutorialFile = await uploadGeminiFile(ai, tutorialBytes, tutorialMime, `${piece.code}-tutorial`);
      uploaded.push(tutorialFile.name);
      files.push(tutorialFile);
      sourceJson.tutorialSha256 = sha256(tutorialBytes);
      sourceJson.tutorialMime = tutorialMime;
    }

    const system = await loadPrompt("train_piece.md");
    const baseUser = trainUserText({ title: piece.title, note: piece.note, ...assets });
    const strictUser = trainUserText({ title: piece.title, note: piece.note, ...assets, strict: true });

    const first = await generateGeminiJson({
      ai,
      model: modelName,
      system,
      schema: TRAIN_RESPONSE_SCHEMA,
      thinkingLevel: ThinkingLevel.HIGH,
      files,
      userText: baseUser,
    });
    let extract = parseTrainExtract(first.data);
    let usage = first.usage;
    let usedModel = first.model;
    let retried = false;

    if (isThinTrainExtract(extract, assets)) {
      retried = true;
      const second = await generateGeminiJson({
        ai,
        model: modelName,
        system,
        schema: TRAIN_RESPONSE_SCHEMA,
        thinkingLevel: ThinkingLevel.HIGH,
        files,
        userText: strictUser,
      });
      usage = {
        inputTokens: first.usage.inputTokens + second.usage.inputTokens,
        outputTokens: first.usage.outputTokens + second.usage.outputTokens,
      };
      const retryExtract = parseTrainExtract(second.data);
      if (trainExtractRichness(retryExtract) >= trainExtractRichness(extract)) {
        extract = retryExtract;
        usedModel = second.model;
      }
    }

    const { scoreJson, tutorialCuesJson } = splitTrainExtract(extract);

    await prisma.pieceModel.update({
      where: { id: row.id },
      data: {
        status: "ready",
        scoreJson: scoreJson as unknown as Prisma.InputJsonValue,
        tutorialCuesJson: tutorialCuesJson as unknown as Prisma.InputJsonValue,
        sourceJson: sourceJson as unknown as Prisma.InputJsonValue,
        trainedAt: new Date(),
        error: null,
      },
    });

    await prisma.event.create({
      data: {
        actorType: "system",
        teacherId: piece.teacherId,
        actorId: pieceId,
        name: "piece.train",
        propsJson: {
          pieceModelId: row.id,
          version,
          geminiModel: usedModel,
          assets,
          ...usage,
          costCents: geminiCostCents(usage),
          latencyMs: Date.now() - started,
          retried,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "train failed";
    await prisma.pieceModel.update({
      where: { id: row.id },
      data: { status: "failed", error: message.slice(0, 2000) },
    });
    throw error;
  } finally {
    await Promise.all(uploaded.map((name) => deleteGeminiFile(ai, name)));
  }
}
