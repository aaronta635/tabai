import { beforeEach, describe, expect, it, vi } from "vitest";
import { GEMINI_VISUAL_ERROR_CODES } from "@/lib/gemini-visual";
import { PIPELINE_VERSION } from "@/lib/constants";

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

const takeSubmission = { ...practiceSubmission, kind: "take" as const };

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
  extractPitchFromWav.mockResolvedValue({
    notes: [{ tStart: 0, tEnd: 1, midi: 55, name: "G3" }],
    errorCode: undefined,
  });
  writeVideoWav.mockReturnValue(undefined);
  uploadMedia.mockResolvedValue(undefined);
  media.update.mockResolvedValue(undefined);
  analysis.create.mockResolvedValue({ id: "an-1" });
  submission.update.mockResolvedValue(undefined);
  enqueueTrainIfIdle.mockResolvedValue(undefined);
  enqueueJob.mockResolvedValue({ id: "draft-1" });
  geminiClient.mockReturnValue({ files: { delete: vi.fn() } });
});

describe("mergeGeminiVisualPassResult", () => {
  it("does not double-count cost on failure", () => {
    const base = {
      observations: undefined,
      heardExtract: null,
      metrics: { duration_s: 12 },
      heardNotes: [],
      pipelineVersion: PIPELINE_VERSION,
      costCents: 3,
      confidence: null,
    };
    const failed = {
      ...base,
      visualOk: false as const,
      costDelta: 0,
      visualErrorCode: GEMINI_VISUAL_ERROR_CODES.upload_failed,
    };
    expect(mergeGeminiVisualPassResult(base, failed).costCents).toBe(3);
  });

  it("keeps heard_extract when compare is missing on an untrained piece", () => {
    const extract = {
      title: "Song",
      sections: [{ name: "A", startBar: 1, endBar: 1, chords: ["G"], melodyNotes: ["G"] }],
    };
    const base = {
      observations: undefined,
      heardExtract: null,
      metrics: { duration_s: 12 },
      heardNotes: [],
      pipelineVersion: PIPELINE_VERSION,
      costCents: 0,
      confidence: null,
    };
    const partial: Parameters<typeof mergeGeminiVisualPassResult>[1] = {
      observations: undefined,
      heardExtract: extract,
      metrics: { duration_s: 12, heard_extract: extract },
      heardNotes: [],
      pipelineVersion: PIPELINE_VERSION,
      costCents: 0,
      confidence: null,
      visualOk: true,
      costDelta: 2,
    };
    const merged = mergeGeminiVisualPassResult(base, partial);
    expect(merged.heardExtract).toEqual(extract);
    expect(merged.costCents).toBe(2);
  });
});

describe("runAnalyze promotion catch-up", () => {
  it("runs catch-up and keeps pitch data when Gemini upload fails", async () => {
    submission.findUnique
      .mockResolvedValueOnce(practiceSubmission)
      .mockResolvedValue({ kind: "take", status: "received" });
    uploadGeminiFile.mockRejectedValueOnce(new Error('{"error":{"code":404}}'));

    await runAnalyze("sub-1");

    expect(uploadGeminiFile).toHaveBeenCalledTimes(1);
    const saved = analysis.create.mock.calls[0]?.[0]?.data;
    expect((saved?.metricsJson as { gemini_visual_error_code?: string }).gemini_visual_error_code).toBe(
      GEMINI_VISUAL_ERROR_CODES.upload_failed,
    );
    expect((saved?.metricsJson as { pitch_notes?: unknown[] }).pitch_notes).toHaveLength(1);
  });

  it("catch-up on a promoted clip includes pitch overlay issues", async () => {
    submission.findUnique
      .mockResolvedValueOnce(practiceSubmission)
      .mockResolvedValue({ kind: "take", status: "received" });
    uploadGeminiFile.mockResolvedValue({ name: "files/x", uri: "https://x", mimeType: "video/mp4" });
    vi.mocked(generateGeminiJson)
      .mockResolvedValueOnce({
        data: { title: "Song", sections: [{ name: "A", chords: ["G"], melodyNotes: ["G"] }] },
        usage: { inputTokens: 1, outputTokens: 1 },
        model: "gemini-test",
      })
      .mockResolvedValueOnce({
        data: {
          overallFit: 0.5,
          confidence: 0.5,
          positives: [],
          issues: [],
          nextPractice: "again",
        },
        usage: { inputTokens: 1, outputTokens: 1 },
        model: "gemini-test",
      });

    await runAnalyze("sub-1");

    expect(vi.mocked(generateGeminiJson)).toHaveBeenCalledTimes(2);
    const saved = analysis.create.mock.calls[0]?.[0]?.data;
    expect((saved?.metricsJson as { pitch_overlay_version?: string }).pitch_overlay_version).toBeTruthy();
    expect(saved?.observationsJson).toBeTruthy();
  });

  it("uploads once during catch-up on a promoted clip", async () => {
    submission.findUnique
      .mockResolvedValueOnce(practiceSubmission)
      .mockResolvedValue({ kind: "take", status: "received" });
    uploadGeminiFile.mockResolvedValueOnce({ name: "files/x", uri: "https://x", mimeType: "video/mp4" });
    vi.mocked(generateGeminiJson).mockResolvedValueOnce({
      data: { title: "Song", sections: [{ name: "A", chords: [], melodyNotes: [] }] },
      usage: { inputTokens: 1, outputTokens: 1 },
      model: "gemini-test",
    });

    await runAnalyze("sub-1");

    expect(uploadGeminiFile).toHaveBeenCalledTimes(1);
  });

  it("keeps heard_extract on an untrained piece take without compare observations", async () => {
    getReadyPieceModel.mockResolvedValue(null);
    submission.findUnique
      .mockResolvedValueOnce(takeSubmission)
      .mockResolvedValue({ kind: "take", status: "received" });
    uploadGeminiFile.mockResolvedValueOnce({ name: "files/x", uri: "https://x", mimeType: "video/mp4" });
    vi.mocked(generateGeminiJson).mockResolvedValueOnce({
      data: { title: "Song", sections: [{ name: "A", chords: [], melodyNotes: [] }] },
      usage: { inputTokens: 1, outputTokens: 1 },
      model: "gemini-test",
    });

    await runAnalyze("sub-1");

    const saved = analysis.create.mock.calls[0]?.[0]?.data;
    expect((saved?.metricsJson as { heard_extract?: unknown }).heard_extract).toBeTruthy();
    expect(saved?.observationsJson).toBeUndefined();
  });

  it("uploads once for a normal take on an untrained piece", async () => {
    getReadyPieceModel.mockResolvedValue(null);
    submission.findUnique
      .mockResolvedValueOnce(takeSubmission)
      .mockResolvedValue({ kind: "take", status: "received" });
    uploadGeminiFile.mockResolvedValueOnce({ name: "files/x", uri: "https://x", mimeType: "video/mp4" });
    vi.mocked(generateGeminiJson).mockResolvedValueOnce({
      data: { title: "Song", sections: [{ name: "A", chords: [], melodyNotes: [] }] },
      usage: { inputTokens: 1, outputTokens: 1 },
      model: "gemini-test",
    });

    await runAnalyze("sub-1");

    expect(uploadGeminiFile).toHaveBeenCalledTimes(1);
  });
});

describe("needsGeminiCatchUpAfterPromotion", () => {
  it("detects when Gemini is incomplete for a trained piece", () => {
    expect(needsGeminiCatchUpAfterPromotion(true, "take")).toBe(true);
    expect(
      geminiVisualComplete({ heard_extract: { title: "T", sections: [] } }, null, false),
    ).toBe(true);
    expect(
      geminiVisualComplete(
        { heard_extract: { title: "T", sections: [] } },
        { overallFit: 1, confidence: 1, positives: [], issues: [], nextPractice: "" },
        true,
      ),
    ).toBe(true);
  });
});