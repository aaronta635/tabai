import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Prisma } from "@prisma/client";
import { COMPARE_PROMPT_VERSION, PIPELINE_VERSION, PIPELINE_VERSION_SCORE } from "../lib/constants";
import { getReadyPieceModel, sniffMime } from "../lib/catalog";
import {
  COMPARE_RESPONSE_SCHEMA,
  deleteGeminiFile,
  geminiClient,
  geminiCompareModel,
  geminiCostCents,
  generateGeminiJson,
  uploadGeminiFile,
} from "../lib/gemini";
import { enqueueJob } from "../lib/jobs";
import { prisma } from "../lib/prisma";
import { parseCompareObservations, type PieceModelSourceJson } from "../lib/score-model";
import { downloadMedia, uploadMedia } from "../lib/storage";

function runPython(script: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn("python3", [script, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (chunk) => {
      out += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      err += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(out.trim());
      else reject(new Error(err || `analyze.py exited ${code}`));
    });
  });
}

async function compareTake(input: {
  videoBytes: Buffer;
  pieceTitle: string;
  pieceNote: string | null;
  metrics: Prisma.InputJsonValue;
  scoreJson: Prisma.JsonValue;
  tutorialCuesJson: Prisma.JsonValue;
  sameAsTutorial: boolean;
  hasSheet: boolean;
}) {
  const ai = geminiClient();
  if (!ai) return null;
  const uploaded: string[] = [];
  try {
    const video = await uploadGeminiFile(
      ai,
      input.videoBytes,
      sniffMime(input.videoBytes, "video/mp4"),
      `${input.pieceTitle}-take`,
    );
    uploaded.push(video.name);
    const system = await readFile(join(process.cwd(), "prompts/compare_take.md"), "utf8");
    const result = await generateGeminiJson({
      ai,
      model: geminiCompareModel(),
      system,
      schema: COMPARE_RESPONSE_SCHEMA,
      files: [video],
      userText: [
        `Piece: ${input.pieceTitle}`,
        input.pieceNote ? `Teacher note: ${input.pieceNote}` : "No teacher note.",
        `Saved score model: ${JSON.stringify(input.scoreJson)}`,
        `Tutorial cues: ${JSON.stringify(input.tutorialCuesJson)}`,
        `Audio metrics: ${JSON.stringify(input.metrics)}`,
        "The attached file is a student take. Compare it to the saved model.",
        "Metrics are hints only. Do not treat high tempo_stability as an issue unless the video is clearly off the written meter.",
        "Issues are deltas from the score/cues. Empty issues is correct when the take matches. Do not invent problems.",
        "Every issue needs tStart in seconds on the student video.",
        input.hasSheet
          ? "The saved model includes a written sheet. Set bar when the score makes it obvious."
          : "There was no sheet. Do not invent bar numbers. Compare to tutorial cues and what you hear.",
        input.sameAsTutorial
          ? "THIS TAKE IS THE PIECE TUTORIAL FILE (same media). overallFit must be ~1. issues must be []. Positives only — do not flag rubato, position shifts, or talking."
          : "This is not the tutorial file. Only flag clear student errors.",
      ].join("\n\n"),
    });
    let observations = parseCompareObservations(result.data);
    if (input.sameAsTutorial) {
      observations = {
        ...observations,
        overallFit: Math.max(observations.overallFit, 0.95),
        confidence: Math.max(observations.confidence, 0.9),
        issues: [],
        nextPractice: observations.nextPractice || "Giữ đúng cảm giác take này.",
      };
    }
    return {
      observations,
      costCents: geminiCostCents(result.usage),
      usage: result.usage,
      model: result.model,
    };
  } finally {
    const aiClient = geminiClient();
    if (aiClient) {
      await Promise.all(uploaded.map((name) => deleteGeminiFile(aiClient, name)));
    }
  }
}

export async function runAnalyze(submissionId: string) {
  const started = Date.now();
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { student: true, media: true, piece: true },
  });
  if (!submission) throw new Error("submission not found");
  if (!submission.student.approvedAt) {
    throw new Error("student not approved — refusing analyze");
  }

  const dir = await mkdtemp(join(tmpdir(), "analyze-"));
  const videoPath = join(dir, "take.bin");
  try {
    const bytes = await downloadMedia(submission.media.storagePath);
    await writeFile(videoPath, bytes);

    let metrics: Prisma.InputJsonValue = { skipped: true };
    try {
      const raw = await runPython(join(process.cwd(), "scripts/analyze.py"), [videoPath]);
      metrics = JSON.parse(raw) as Prisma.InputJsonValue;
    } catch (error) {
      metrics = {
        skipped: true,
        error: error instanceof Error ? error.message : "analyze failed",
      };
    }

    const durationS =
      typeof (metrics as { duration_s?: number }).duration_s === "number"
        ? (metrics as { duration_s: number }).duration_s
        : submission.media.durationS;

    await prisma.media.update({
      where: { id: submission.mediaId },
      data: { durationS: durationS ?? undefined, sizeBytes: bytes.length },
    });

    const audioPath = `derived/${submission.id}/audio.wav`;
    try {
      const wavOut = join(dir, "audio.wav");
      spawnSync(
        "ffmpeg",
        ["-y", "-i", videoPath, "-vn", "-ac", "1", "-ar", "22050", wavOut],
        { stdio: "ignore" },
      );
      const wav = await readFile(wavOut);
      await uploadMedia(audioPath, wav, "audio/wav");
    } catch {
      // derivative is best-effort
    }

    let observations: Prisma.InputJsonValue | undefined;
    let pipelineVersion = PIPELINE_VERSION;
    let costCents = 0;
    let confidence: number | null = null;

    const pieceModel = await getReadyPieceModel(submission.pieceId);
    if (pieceModel) {
      try {
        const source = (pieceModel.sourceJson ?? null) as PieceModelSourceJson | null;
        const compared = await compareTake({
          videoBytes: bytes,
          pieceTitle: submission.piece.title,
          pieceNote: submission.piece.note,
          metrics,
          scoreJson: pieceModel.scoreJson,
          tutorialCuesJson: pieceModel.tutorialCuesJson,
          sameAsTutorial: Boolean(
            submission.piece.tutorialMediaId && submission.mediaId === submission.piece.tutorialMediaId,
          ),
          hasSheet: Boolean(source?.sheetMediaId || submission.piece.sheetMediaId),
        });
        if (compared) {
          observations = compared.observations as unknown as Prisma.InputJsonValue;
          pipelineVersion = PIPELINE_VERSION_SCORE;
          costCents = compared.costCents;
          confidence = compared.observations.confidence;
          await prisma.event.create({
            data: {
              actorType: "system",
              teacherId: submission.piece.teacherId,
              actorId: submissionId,
              name: "piece.compare",
              propsJson: {
                pieceModelId: pieceModel.id,
                version: pieceModel.version,
                promptVersion: COMPARE_PROMPT_VERSION,
                geminiModel: compared.model,
                ...compared.usage,
                costCents,
                confidence,
              },
            },
          });
        }
      } catch (error) {
        console.error(
          "score compare skipped",
          submissionId,
          error instanceof Error ? error.message : error,
        );
      }
    }

    await prisma.analysis.create({
      data: {
        submissionId,
        pipelineVersion,
        metricsJson: metrics,
        observationsJson: observations,
        costCents,
        latencyMs: Date.now() - started,
      },
    });

    if (confidence != null) {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { confidence },
      });
    }

    if (submission.kind === "practice") return;
    await enqueueJob("draft", { submissionId }, submissionId);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
