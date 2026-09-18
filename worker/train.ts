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
} from "../lib/gemini";
import { prisma } from "../lib/prisma";
import { parseTrainExtract, splitTrainExtract, isThinTrainExtract, trainExtractRichness, type PieceModelSourceJson } from "../lib/score-model";
import { downloadMedia } from "../lib/storage";

async function loadPrompt(name: string) {
  return readFile(join(process.cwd(), "prompts", name), "utf8");
}

export async function runTrainPiece(pieceId: string, extras?: Partial<PieceModelSourceJson>) {
  const piece = await prisma.piece.findUnique({
    where: { id: pieceId },
    include: { sheetMedia: true, tutorialMedia: true },
  });
  if (!piece) throw new Error("piece not found");
  if (!piece.sheetMedia || !piece.tutorialMedia) {
    throw new Error("piece needs sheet and tutorial before train");
  }

  const ai = geminiClient();
  if (!ai) throw new Error("GEMINI_API_KEY is not set");

  const last = await prisma.pieceModel.findFirst({
    where: { pieceId },
    orderBy: { version: "desc" },
  });
  const version = (last?.version ?? 0) + 1;
  const modelName = geminiTrainModel();
  const sourceJson: PieceModelSourceJson = {
    sheetMediaId: piece.sheetMedia.id,
    tutorialMediaId: piece.tutorialMedia.id,
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
  const started = Date.now();
  try {
    const sheetBytes = await downloadMedia(piece.sheetMedia.storagePath);
    const tutorialBytes = await downloadMedia(piece.tutorialMedia.storagePath);
    const sheetMime = sniffMime(sheetBytes, "application/pdf");
    const tutorialMime = sniffMime(tutorialBytes, "video/mp4");

    const sheetFile = await uploadGeminiFile(ai, sheetBytes, sheetMime, `${piece.code}-sheet`);
    uploaded.push(sheetFile.name);
    const tutorialFile = await uploadGeminiFile(ai, tutorialBytes, tutorialMime, `${piece.code}-tutorial`);
    uploaded.push(tutorialFile.name);

    const system = await loadPrompt("train_piece.md");
    const baseUser = [
      `Piece title: ${piece.title}`,
      piece.note ? `Teacher note: ${piece.note}` : "No teacher note.",
      "First file is the sheet. Second file is the tutorial video.",
      "Extract the piece model JSON.",
    ].join("\n");
    const strictUser = [
      baseUser,
      "Previous extract was too thin. Retry:",
      "- melodyNotes must be the written tune in order, never a scale.",
      "- tutorialCues: at least four timestamped cues from the video.",
      "- Fill techniqueFocus and commonMistakes from the tutor.",
    ].join("\n");

    const first = await generateGeminiJson({
      ai,
      model: modelName,
      system,
      schema: TRAIN_RESPONSE_SCHEMA,
      thinkingLevel: ThinkingLevel.HIGH,
      files: [sheetFile, tutorialFile],
      userText: baseUser,
    });
    let extract = parseTrainExtract(first.data);
    let usage = first.usage;
    let usedModel = first.model;
    let retried = false;

    if (isThinTrainExtract(extract)) {
      retried = true;
      const second = await generateGeminiJson({
        ai,
        model: modelName,
        system,
        schema: TRAIN_RESPONSE_SCHEMA,
        thinkingLevel: ThinkingLevel.HIGH,
        files: [sheetFile, tutorialFile],
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
    sourceJson.sheetSha256 = sha256(sheetBytes);
    sourceJson.tutorialSha256 = sha256(tutorialBytes);
    sourceJson.sheetMime = sheetMime;
    sourceJson.tutorialMime = tutorialMime;

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
