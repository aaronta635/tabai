import { mkdtemp, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Prisma, SubmissionKind } from "@prisma/client";
import { ANALYZE_PYTHON_WAIT_MS, COMPARE_PROMPT_VERSION, EXTRACT_TAKE_PROMPT_VERSION, PIPELINE_VERSION, PIPELINE_VERSION_SCORE, PITCH_OVERLAY_VERSION } from "../lib/constants";
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
import { usesGeminiVisual } from "../lib/practice";
import {
  factVerdictsComplete,
  parseCompareObservations,
  parseTrainExtract,
  type CompareObservations,
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

const EMPTY_OBSERVATIONS: CompareObservations = {
  overallFit: 0,
  confidence: 0.5,
  positives: [],
  issues: [],
  nextPractice: "",
};

async function applyHeardPitchOverlay(input: {
  submissionId: string;
  pieceModel: Awaited<ReturnType<typeof getReadyPieceModel>>;
  tutorialMediaId: string | null;
  teacherLocale: "en" | "vi";
  videoPath: string;
  dir: string;
  heardNotes: HeardPitchNote[];
  metrics: Prisma.InputJsonValue;
  observations: CompareObservations;
}) {
  let heardNotes = input.heardNotes;
  let metrics = input.metrics;
  let tutorialNotes: HeardPitchNote[] = [];
  const cues = (input.pieceModel?.tutorialCuesJson as TutorialCuesJson | null)?.cues ?? [];
  if (pitchEnabled() && input.pieceModel) {
    tutorialNotes = pitchNotesFromMetrics(input.pieceModel.tutorialCuesJson);
    let tutorialDirty = false;
    const tutorialPath = join(input.dir, "tutorial.bin");
    const loadTutorial = async () => {
      if (!input.tutorialMediaId) return false;
      try {
        await readFile(tutorialPath);
        return true;
      } catch {
        const tutorial = await prisma.media.findUnique({
          where: { id: input.tutorialMediaId },
        });
        if (!tutorial) return false;
        await writeFile(tutorialPath, await downloadMedia(tutorial.storagePath));
        return true;
      }
    };
    if (tutorialNotes.length === 0 && input.tutorialMediaId) {
      try {
        if (await loadTutorial()) {
          const pitched = await extractPitchFromVideo(tutorialPath, join(input.dir, "tutorial.wav"));
          tutorialNotes = pitched.notes;
          tutorialDirty = true;
        }
      } catch (error) {
        console.error(
          "tutorial pitch skipped",
          input.submissionId,
          error instanceof Error ? error.message : error,
        );
      }
    }
    try {
      const labeled = await labelMismatchFrets({
        takeVideo: input.videoPath,
        tutorialVideo: null,
        heard: heardNotes,
        tutorial: tutorialNotes,
      });
      heardNotes = labeled.heard;
      metrics = {
        ...(metrics as object),
        pitch_notes: heardNotes,
      };
    } catch (error) {
      console.error(
        "fret labels skipped",
        input.submissionId,
        error instanceof Error ? error.message : error,
      );
    }
    if (tutorialDirty && tutorialNotes.length > 0) {
      const cuesJson = {
        ...((input.pieceModel.tutorialCuesJson && typeof input.pieceModel.tutorialCuesJson === "object"
          ? input.pieceModel.tutorialCuesJson
          : {}) as object),
        pitch_notes: tutorialNotes,
        pitch_backend: "basic-pitch",
      };
      await prisma.pieceModel.update({
        where: { id: input.pieceModel.id },
        data: { tutorialCuesJson: cuesJson as Prisma.InputJsonValue },
      });
    }
  }
  const metricRow = metrics as {
    silence_ratio?: unknown;
    duration_s?: unknown;
    pitch_error?: unknown;
    tempo_bpm?: unknown;
  };
  const score = (input.pieceModel?.scoreJson ?? null) as ScoreJson | null;
  return {
    observations: overlayPitchIssues(input.observations, heardNotes, score, cues, tutorialNotes, {
      silenceRatio: typeof metricRow.silence_ratio === "number" ? metricRow.silence_ratio : null,
      durationS: typeof metricRow.duration_s === "number" ? metricRow.duration_s : null,
      pitchError: typeof metricRow.pitch_error === "string" ? metricRow.pitch_error : null,
      locale: input.teacherLocale,
      takeBpm: typeof metricRow.tempo_bpm === "number" ? metricRow.tempo_bpm : null,
      referenceBpm: typeof score?.tempoBpm === "number" ? score.tempoBpm : null,
      allowFasterTempo: score?.allowFasterTempo === true,
    }),
    metrics,
    heardNotes,
  };
}

type AnalyzeSubmission = NonNullable<Awaited<ReturnType<typeof loadAnalyzeSubmission>>>;

async function loadAnalyzeSubmission(submissionId: string) {
  return prisma.submission.findUnique({
    where: { id: submissionId },
    include: { student: true, media: true, piece: { include: { teacher: { select: { feedbackLocale: true } } } } },
  });
}

/** True when an in-flight practice pitch job should finish with Gemini after promotion. */
export function needsGeminiCatchUpAfterPromotion(startedAsPractice: boolean, kindNow: SubmissionKind) {
  return startedAsPractice && usesGeminiVisual(kindNow);
}

async function runGeminiVisualPass(input: {
  submission: AnalyzeSubmission;
  submissionId: string;
  bytes: Buffer;
  videoPath: string;
  dir: string;
  pieceModel: Awaited<ReturnType<typeof getReadyPieceModel>>;
  heardNotes: HeardPitchNote[];
  metrics: Prisma.InputJsonValue;
  pipelineVersion: string;
  costCents: number;
}) {
  let heardNotes = input.heardNotes;
  let metrics = input.metrics;
  let pipelineVersion = input.pipelineVersion;
  let costCents = input.costCents;
  let observations: Prisma.InputJsonValue | undefined;
  let heardExtract: TrainExtract | null = null;
  let confidence: number | null = null;

  const ai = geminiClient();
  if (!ai) {
    return { observations, heardExtract, metrics, heardNotes, pipelineVersion, costCents, confidence };
  }

  const uploaded: string[] = [];
  try {
    const video = await uploadGeminiFile(
      ai,
      input.bytes,
      sniffMime(input.bytes, "video/mp4"),
      `${input.submission.piece.title}-take`,
    );
    uploaded.push(video.name);

    try {
      const heard = await extractHeardTake({
        file: video,
        pieceTitle: input.submission.piece.title,
      });
      if (heard) {
        heardExtract = heard.extract;
        metrics = { ...(metrics as object), heard_extract: heard.extract };
        costCents += heard.costCents;
        await prisma.event.create({
          data: {
            actorType: "system",
            teacherId: input.submission.piece.teacherId,
            actorId: input.submissionId,
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
        input.submissionId,
        error instanceof Error ? error.message : error,
      );
    }

    if (input.pieceModel) {
      try {
        const source = (input.pieceModel.sourceJson ?? null) as PieceModelSourceJson | null;
        const compared = await compareTake({
          file: video,
          pieceTitle: input.submission.piece.title,
          pieceNote: input.submission.piece.note,
          metrics,
          scoreJson: input.pieceModel.scoreJson,
          tutorialCuesJson: input.pieceModel.tutorialCuesJson,
          heardExtract,
          sameAsTutorial: Boolean(
            input.submission.piece.tutorialMediaId && input.submission.mediaId === input.submission.piece.tutorialMediaId,
          ),
          hasSheet: Boolean(source?.sheetMediaId || input.submission.piece.sheetMediaId),
        });
        if (compared) {
          let observationsParsed = compared.observations;
          if (pitchEnabled()) {
            const overlaid = await applyHeardPitchOverlay({
              submissionId: input.submissionId,
              pieceModel: input.pieceModel,
              tutorialMediaId: input.submission.piece.tutorialMediaId,
              teacherLocale: input.submission.piece.teacher.feedbackLocale === "en" ? "en" : "vi",
              videoPath: input.videoPath,
              dir: input.dir,
              heardNotes,
              metrics,
              observations: observationsParsed,
            });
            heardNotes = overlaid.heardNotes;
            metrics = overlaid.metrics;
            observationsParsed = overlaid.observations;
          }
          observations = observationsParsed as unknown as Prisma.InputJsonValue;
          pipelineVersion = PIPELINE_VERSION_SCORE;
          costCents += compared.costCents;
          confidence = observationsParsed.confidence;
          await prisma.event.create({
            data: {
              actorType: "system",
              teacherId: input.submission.piece.teacherId,
              actorId: input.submissionId,
              name: "piece.compare",
              propsJson: {
                pieceModelId: input.pieceModel.id,
                version: input.pieceModel.version,
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
          input.submissionId,
          error instanceof Error ? error.message : error,
        );
      }
    }
  } finally {
    await Promise.all(uploaded.map((name) => deleteGeminiFile(ai, name)));
  }

  return { observations, heardExtract, metrics, heardNotes, pipelineVersion, costCents, confidence };
}

export async function runAnalyze(submissionId: string) {
  const started = Date.now();
  const submission = await loadAnalyzeSubmission(submissionId);
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
      const raw = await runPython(join(process.cwd(), "scripts/analyze.py"), [videoPath], "python3", ANALYZE_PYTHON_WAIT_MS);
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

    const startedAsPractice = submission.kind === "practice";
    const visual = usesGeminiVisual(submission.kind);
    if (visual) {
      const gemini = await runGeminiVisualPass({
        submission,
        submissionId,
        bytes,
        videoPath,
        dir,
        pieceModel,
        heardNotes,
        metrics,
        pipelineVersion,
        costCents,
      });
      observations = gemini.observations;
      heardExtract = gemini.heardExtract;
      heardNotes = gemini.heardNotes;
      metrics = gemini.metrics;
      pipelineVersion = gemini.pipelineVersion;
      costCents = gemini.costCents;
      confidence = gemini.confidence;
    } else if (!visual) {
      const overlaid = await applyHeardPitchOverlay({
        submissionId,
        pieceModel,
        tutorialMediaId: submission.piece.tutorialMediaId,
        teacherLocale: submission.piece.teacher.feedbackLocale === "en" ? "en" : "vi",
        videoPath,
        dir,
        heardNotes,
        metrics,
        observations: EMPTY_OBSERVATIONS,
      });
      heardNotes = overlaid.heardNotes;
      metrics = overlaid.metrics;
      observations = overlaid.observations as unknown as Prisma.InputJsonValue;
      if (pieceModel) pipelineVersion = PIPELINE_VERSION_SCORE;
      confidence = overlaid.observations.confidence;
    }

    const kindNow = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { kind: true, status: true },
    });
    if (kindNow && needsGeminiCatchUpAfterPromotion(startedAsPractice, kindNow.kind)) {
      const gemini = await runGeminiVisualPass({
        submission,
        submissionId,
        bytes,
        videoPath,
        dir,
        pieceModel,
        heardNotes,
        metrics,
        pipelineVersion,
        costCents,
      });
      observations = gemini.observations;
      heardExtract = gemini.heardExtract;
      heardNotes = gemini.heardNotes;
      metrics = gemini.metrics;
      pipelineVersion = gemini.pipelineVersion;
      costCents = gemini.costCents;
      confidence = gemini.confidence;
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

    if (!kindNow) return;

    if (kindNow.kind === "practice") return;
    if (!observations) return;
    if (!isClaimableStatus(kindNow.status)) return;
    if (!factVerdictsComplete(parseCompareObservations(observations))) return;
    await enqueueJob("draft", { submissionId }, submissionId);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
