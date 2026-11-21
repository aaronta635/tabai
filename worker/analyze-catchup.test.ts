import { beforeEach, describe, expect, it, vi } from "vitest";
import { PIPELINE_VERSION_SCORE } from "@/lib/constants";

const submission = vi.hoisted(() => ({ findUnique: vi.fn(), update: vi.fn() }));
const media = vi.hoisted(() => ({ update: vi.fn() }));
const analysis = vi.hoisted(() => ({ create: vi.fn() }));
const event = vi.hoisted(() => ({ create: vi.fn() }));
const enqueueTrainIfIdle = vi.hoisted(() => vi.fn());
const getReadyPieceModel = vi.hoisted(() => vi.fn());
const downloadMedia = vi.hoisted(() => vi.fn());
const uploadMedia = vi.hoisted(() => vi.fn());
const runPython = vi.hoisted(() => vi.fn());
const writeVideoWav = vi.hoisted(() => vi.fn());
const extractPitchFromWav = vi.hoisted(() => vi.fn());
const pitchEnabled = vi.hoisted(() => vi.fn());
const uploadGeminiFile = vi.hoisted(() => vi.fn());
const geminiClient = vi.hoisted(() => vi.fn());
const enqueueJob = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: { submission, media, analysis, event } }));
vi.mock("@/lib/catalog", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/catalog")>();
  return { ...original, enqueueTrainIfIdle, getReadyPieceModel };
});
vi.mock("@/lib/storage", () => ({ downloadMedia, uploadMedia }));
vi.mock("@/lib/jobs", () => ({ enqueueJob }));
vi.mock("@/lib/gemini", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/gemini")>();
  return {
    ...original,
    uploadGeminiFile,
    geminiClient,
    generateGeminiJson: vi.fn(),
    deleteGeminiFile: vi.fn(),
  };
});
vi.mock("./pitch", () => ({
  extractPitchFromWav,
  pitchEnabled,
  runPython,
  writeVideoWav,
}));
vi.mock("./position", () => ({
  labelMismatchFrets: vi.fn(async ({ heard }: { heard: unknown[] }) => ({ heard })),
}));

import {
  geminiVisualComplete,
  mergeGeminiVisualPassResult,
  needsGeminiCatchUpAfterPromotion,
  runAnalyze,
} from "./analyze";
import { generateGeminiJson } from "@/lib/gemini";

const practiceSubmission = {
  id: "sub-1",
  pieceId: "piece-1",
  mediaId: "media-1",
  kind: "practice" as const,
  status: "received",
  student: { approvedAt: new Date("2026-10-01") },
  piece: {
    demo: false,
    title: "Song",
    teacherId: "t-1",
    tutorialMediaId: null,
    sheetMediaId: null,
    note: null,
    teacher: { feedbackLocale: "en" },
  },
  media: { storagePath: "takes/x", durationS: 10 },
};

beforeEach(() => {
  vi.clearAllMocks();
    pitchEnabled.mockReturnValue(true);
  getReadyPieceModel.mockResolvedValue({
    id: "pm-1",
    scoreJson: { title: "T", sections: [] },
    tutorialCuesJson: { cues: [] },
    version: 1,
    sourceJson: null,
  });
  downloadMedia.mockResolvedValue(Buffer.from("video"));
  runPython.mockResolvedValue(JSON.stringify({ duration_s: 12, silence_ratio: 0.1 }));
  extractPitchFromWav.mockResolvedValue({ notes: [{ tStart: 0, tEnd: 1, midi: 60, name: "C4" }], error: null });
  writeVideoWav.mockReturnValue(undefined);
  uploadMedia.mockResolvedValue(undefined);
  media.update.mockResolvedValue(undefined);
  analysis.create.mockResolvedValue({ id: "an-1" });
  submission.update.mockResolvedValue(undefined);
  enqueueTrainIfIdle.mockResolvedValue(undefined);
  enqueueJob.mockResolvedValue({ id: "draft-1" });
  geminiClient.mockReturnValue({ files: { delete: vi.fn() } });
});

describe("analyze promotion catch-up", () => {
  it("merges Gemini failures without wiping practice pitch results", () => {
    const base = {
      observations: { overallFit: 0.5, confidence: 0.5, positives: [], issues: [], nextPractice: "" },
      heardExtract: null,
      metrics: { pitch_notes: [{ tStart: 0, tEnd: 1, midi: 60, name: "C4" }], duration_s: 12 },
      heardNotes: [{ tStart: 0, tEnd: 1, midi: 60, name: "C4" }],
      pipelineVersion: PIPELINE_VERSION_SCORE,
      costCents: 0,
      confidence: 0.5,
    };
    const failed = {
      ...base,
      observations: undefined,
      metrics: base.metrics,
      visualOk: false as const,
      visualError: "Gemini file upload failed.",
    };
    const merged = mergeGeminiVisualPassResult(base, failed);
    expect(merged.observations).toEqual(base.observations);
    expect((merged.metrics as { gemini_visual_error?: string }).gemini_visual_error).toBe("Gemini file upload failed.");
  });

  it("runs catch-up and keeps pitch data when Gemini upload fails", async () => {
    submission.findUnique
      .mockResolvedValueOnce(practiceSubmission)
      .mockResolvedValue({ kind: "take", status: "received" });
    uploadGeminiFile.mockRejectedValueOnce(new Error('{"error":{"code":404,"status":"Not Found"}}'));

    await runAnalyze("sub-1");

    expect(uploadGeminiFile).toHaveBeenCalledTimes(1);
    expect(analysis.create).toHaveBeenCalled();
    const saved = analysis.create.mock.calls[0]?.[0]?.data;
    expect((saved?.metricsJson as { gemini_visual_error?: string }).gemini_visual_error).toBe(
      "Gemini could not analyze this video.",
    );
    expect((saved?.metricsJson as { pitch_notes?: unknown[] }).pitch_notes).toHaveLength(1);
    expect(saved?.observationsJson).toBeTruthy();
  });

  it("records Gemini compare when catch-up succeeds", async () => {
    submission.findUnique
      .mockResolvedValueOnce(practiceSubmission)
      .mockResolvedValue({ kind: "take", status: "received" });
    uploadGeminiFile.mockResolvedValueOnce({ name: "files/x", uri: "https://x", mimeType: "video/mp4" });
    vi.mocked(generateGeminiJson)
      .mockResolvedValueOnce({
        data: { title: "Song", sections: [{ name: "A", chords: [], melodyNotes: [] }] },
        usage: { inputTokens: 1, outputTokens: 1 },
        model: "gemini-test",
      })
      .mockResolvedValueOnce({
        data: {
          overallFit: 0.8,
          confidence: 0.8,
          positives: ["Steady"],
          issues: [],
          nextPractice: "Again",
        },
        usage: { inputTokens: 1, outputTokens: 1 },
        model: "gemini-test",
      });

    await runAnalyze("sub-1");

    expect(analysis.create).toHaveBeenCalled();
    const saved = analysis.create.mock.calls[0]?.[0]?.data;
    expect((saved?.metricsJson as { heard_extract?: unknown }).heard_extract).toBeTruthy();
    expect(saved?.observationsJson).toMatchObject({ overallFit: 0.8 });
  });
});

describe("needsGeminiCatchUpAfterPromotion", () => {
  it("detects when Gemini is incomplete", () => {
    expect(needsGeminiCatchUpAfterPromotion(true, "take")).toBe(true);
    expect(
      geminiVisualComplete(
        { heard_extract: { title: "T", sections: [] } },
        { overallFit: 1, confidence: 1, positives: [], issues: [], nextPractice: "" },
      ),
    ).toBe(true);
  });
});