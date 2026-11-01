import { mkdtemp, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Prisma } from "@prisma/client";
import { COMPARE_PROMPT_VERSION, EXTRACT_TAKE_PROMPT_VERSION, PIPELINE_VERSION, PIPELINE_VERSION_SCORE, PITCH_OVERLAY_VERSION } from "../lib/constants";
import { enqueueTrainIfIdle, getReadyPieceModel, sniffMime } from "../lib/catalog";
import {
  COMPARE_RESPONSE_SCHEMA,
  TRAIN_RESPONSE_SCHEMA,
  deleteGeminiFile,
  geminiClient,
  geminiCompareModel,
  geminiCostCents,
  geminiExtractModel,
  generateGeminiJson,
  uploadGeminiFile,
  type GeminiFileRef,
} from "../lib/gemini";
import { enqueueJob } from "../lib/jobs";
import { isClaimableStatus } from "../lib/forms";
import { prisma } from "../lib/prisma";
import { overlayPitchIssues, pitchNotesFromMetrics, type HeardPitchNote } from "../lib/pitch-overlay";
import {
  factVerdictsComplete,
  parseCompareObservations,
  parseTrainExtract,
  type PieceModelSourceJson,
  type ScoreJson,
  type TrainExtract,
  type TutorialCuesJson,
} from "../lib/score-model";
import { downloadMedia, uploadMedia } from "../lib/storage";
import { extractPitchFromVideo, extractPitchFromWav, pitchEnabled, runPython, writeVideoWav } from "./pitch";
import { labelMismatchFrets } from "./position";

async function extractHeardTake(input: {
  file: GeminiFileRef;
  pieceTitle: string;
}) {
  const ai = geminiClient();
  if (!ai) return null;
  const system = await readFile(join(process.cwd(), "prompts/extract_take.md"), "utf8");
  const result = await generateGeminiJson({
    ai,
    model: geminiExtractModel(),
    system,
    schema: TRAIN_RESPONSE_SCHEMA,
    files: [input.file],
    userText: [
      `Piece title (label only, not a chart to copy): ${input.pieceTitle}`,
      "The attached file is the student take. Transcribe what they played. Do not copy a textbook progression.",
    ].join("\n\n"),
  });
  return {
    extract: parseTrainExtract(result.data),
    costCents: geminiCostCents(result.usage),
    usage: result.usage,
    model: result.model,
  };
}

async function compareTake(input: {
  file: GeminiFileRef;
  pieceTitle: string;
  pieceNote: string | null;
  metrics: Prisma.InputJsonValue;
  scoreJson: Prisma.JsonValue;
  tutorialCuesJson: Prisma.JsonValue;
  heardExtract: TrainExtract | null;
  sameAsTutorial: boolean;
  hasSheet: boolean;
}) {
  const ai = geminiClient();
  if (!ai) return null;
  const system = await readFile(join(process.cwd(), "prompts/compare_take.md"), "utf8");
  const result = await generateGeminiJson({
    ai,
    model: geminiCompareModel(),
    system,
    schema: COMPARE_RESPONSE_SCHEMA,
    files: [input.file],
    userText: [
      `Piece: ${input.pieceTitle}`,
      input.pieceNote ? `Teacher note: ${input.pieceNote}` : "No teacher note.",
      `Saved score model: ${JSON.stringify(input.scoreJson)}`,
      `Tutorial cues: ${JSON.stringify(input.tutorialCuesJson)}`,
      input.heardExtract
        ? `Student extract JSON (heard on this take): ${JSON.stringify(input.heardExtract)}`
        : "No student extract JSON.",
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
}

export async function runAnalyze(submissionId: string) {
  const started = Date.now();
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { student: true, media: true, piece: true },
  });
  if (!submission) throw new Error("submission not found");
  if (!submission.piece.demo && !submission.student.approvedAt) {
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
    const wavOut = join(dir, "audio.wav");
    try {
      writeVideoWav(videoPath, wavOut);
      const wav = await readFile(wavOut);
      await uploadMedia(audioPath, wav, "audio/wav");
    } catch {
      // derivative is best-effort
    }

    let heardNotes: HeardPitchNote[] = [];
    if (pitchEnabled()) {
      try {
        const pitched = await extractPitchFromWav(wavOut);
        heardNotes = pitched.notes;
        metrics = {
          ...(metrics as object),
          pitch_notes: heardNotes,
          pitch_backend: "basic-pitch",
          ...(pitched.error
            ? { pitch_error: pitched.error }
            : { pitch_overlay_version: PITCH_OVERLAY_VERSION }),
        };
      } catch (error) {
        heardNotes = [];
        metrics = {
          ...(metrics as object),
          pitch_notes: heardNotes,
          pitch_backend: "basic-pitch",
          pitch_error: error instanceof Error ? error.message : "pitch failed",
        };
      }
    }

    let observations: Prisma.InputJsonValue | undefined;
    let heardExtract: TrainExtract | null = null;
    let pipelineVersion = PIPELINE_VERSION;
    let costCents = 0;
    let confidence: number | null = null;

    const pieceModel = await getReadyPieceModel(submission.pieceId);
    if (!pieceModel) {
      await enqueueTrainIfIdle(submission.pieceId);
    }

    const ai = geminiClient();
    if (ai) {
      const uploaded: string[] = [];
      try {
        const video = await uploadGeminiFile(
          ai,
          bytes,
          sniffMime(bytes, "video/mp4"),
          `${submission.piece.title}-take`,
        );
        uploaded.push(video.name);

        try {
          const heard = await extractHeardTake({
            file: video,
            pieceTitle: submission.piece.title,
          });
          if (heard) {
            heardExtract = heard.extract;
            metrics = { ...(metrics as object), heard_extract: heard.extract };
            costCents += heard.costCents;
            await prisma.event.create({
              data: {
                actorType: "system",
                teacherId: submission.piece.teacherId,
                actorId: submissionId,
                name: "take.extract",
                propsJson: {
                  promptVersion: EXTRACT_TAKE_PROMPT_VERSION,
                  geminiModel: heard.model,
                  ...heard.usage,
                  costCents: heard.costCents,
                },
              },
            });
          }
        } catch (error) {
          console.error(
            "take extract skipped",
            submissionId,
            error instanceof Error ? error.message : error,
          );
        }

        if (pieceModel) {
          try {
            const source = (pieceModel.sourceJson ?? null) as PieceModelSourceJson | null;
            const compared = await compareTake({
              file: video,
              pieceTitle: submission.piece.title,
              pieceNote: submission.piece.note,
              metrics,
              scoreJson: pieceModel.scoreJson,
              tutorialCuesJson: pieceModel.tutorialCuesJson,
              heardExtract,
              sameAsTutorial: Boolean(
                submission.piece.tutorialMediaId && submission.mediaId === submission.piece.tutorialMediaId,
              ),
              hasSheet: Boolean(source?.sheetMediaId || submission.piece.sheetMediaId),
            });
            if (compared) {
              let observationsParsed = compared.observations;
              if (pitchEnabled()) {
                const cues = (pieceModel.tutorialCuesJson as TutorialCuesJson | null)?.cues ?? [];
                let tutorialNotes = pitchNotesFromMetrics(pieceModel.tutorialCuesJson);
                let tutorialDirty = false;
                const tutorialPath = join(dir, "tutorial.bin");
                const loadTutorial = async () => {
                  if (!submission.piece.tutorialMediaId) return false;
                  try {
                    await readFile(tutorialPath);
                    return true;
                  } catch {
                    const tutorial = await prisma.media.findUnique({
                      where: { id: submission.piece.tutorialMediaId },
                    });
                    if (!tutorial) return false;
                    await writeFile(tutorialPath, await downloadMedia(tutorial.storagePath));
                    return true;
                  }
                };
                if (tutorialNotes.length === 0 && submission.piece.tutorialMediaId) {
                  try {
                    if (await loadTutorial()) {
                      const pitched = await extractPitchFromVideo(tutorialPath, join(dir, "tutorial.wav"));
                      tutorialNotes = pitched.notes;
                      tutorialDirty = true;
                    }
                  } catch (error) {
                    console.error(
                      "tutorial pitch skipped",
                      submissionId,
                      error instanceof Error ? error.message : error,
                    );
                  }
                }
                try {
                  const hasTutorial = await loadTutorial();
                  const labeled = await labelMismatchFrets({
                    takeVideo: videoPath,
                    tutorialVideo: hasTutorial ? tutorialPath : null,
                    heard: heardNotes,
                    tutorial: tutorialNotes,
                  });
                  heardNotes = labeled.heard;
                  if (labeled.tutorialChanged) {
                    tutorialNotes = labeled.tutorial;
                    tutorialDirty = true;
                  }
                  metrics = {
                    ...(metrics as object),
                    pitch_notes: heardNotes,
                  };
                } catch (error) {
                  console.error(
                    "fret labels skipped",
                    submissionId,
                    error instanceof Error ? error.message : error,
                  );
                }
                if (tutorialDirty && tutorialNotes.length > 0) {
                  const cuesJson = {
                    ...((pieceModel.tutorialCuesJson && typeof pieceModel.tutorialCuesJson === "object"
                      ? pieceModel.tutorialCuesJson
                      : {}) as object),
                    pitch_notes: tutorialNotes,
                    pitch_backend: "basic-pitch",
                  };
                  await prisma.pieceModel.update({
                    where: { id: pieceModel.id },
                    data: { tutorialCuesJson: cuesJson as Prisma.InputJsonValue },
                  });
                }
                const metricRow = metrics as {
                  silence_ratio?: unknown;
                  duration_s?: unknown;
                  pitch_error?: unknown;
                };
                observationsParsed = overlayPitchIssues(
                  observationsParsed,
                  heardNotes,
                  pieceModel.scoreJson as ScoreJson,
                  cues,
                  tutorialNotes,
                  {
                    silenceRatio: typeof metricRow.silence_ratio === "number" ? metricRow.silence_ratio : null,
                    durationS: typeof metricRow.duration_s === "number" ? metricRow.duration_s : null,
                    pitchError: typeof metricRow.pitch_error === "string" ? metricRow.pitch_error : null,
                  },
                );
              }
              observations = observationsParsed as unknown as Prisma.InputJsonValue;
              pipelineVersion = PIPELINE_VERSION_SCORE;
              costCents += compared.costCents;
              confidence = observationsParsed.confidence;
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
                    costCents: compared.costCents,
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
      } finally {
        await Promise.all(uploaded.map((name) => deleteGeminiFile(ai, name)));
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
    if (!observations) return;
    if (!isClaimableStatus(submission.status)) return;
    if (!factVerdictsComplete(parseCompareObservations(observations))) return;
    await enqueueJob("draft", { submissionId }, submissionId);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
