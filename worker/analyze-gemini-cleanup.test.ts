import { beforeEach, describe, expect, it, vi } from "vitest";
import { GEMINI_VISUAL_ERROR_CODES } from "@/lib/gemini-visual";

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
const deleteGeminiFile = vi.hoisted(() => vi.fn());
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
    deleteGeminiFile,
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

import { generateGeminiJson } from "@/lib/gemini";
import { createGeminiJobUploadTracker, runAnalyze } from "./analyze";

const takeSubmission = {
  id: "sub-1",
  pieceId: "piece-1",
  mediaId: "media-1",
  kind: "take" as const,
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

const uploadRef = { name: "files/child-video", uri: "https://x", mimeType: "video/mp4" };

beforeEach(() => {
  vi.clearAllMocks();
  pitchEnabled.mockReturnValue(false);
  getReadyPieceModel.mockResolvedValue({
    id: "pm-1",
    scoreJson: { title: "T", sections: [] },
    tutorialCuesJson: { cues: [] },
    version: 1,
    sourceJson: null,
  });
  downloadMedia.mockResolvedValue(Buffer.from("video"));
  runPython.mockResolvedValue(JSON.stringify({ duration_s: 12 }));
  extractPitchFromWav.mockResolvedValue({ notes: [], errorCode: undefined });
  writeVideoWav.mockReturnValue(undefined);
  uploadMedia.mockResolvedValue(undefined);
  media.update.mockResolvedValue(undefined);
  analysis.create.mockResolvedValue({ id: "an-1" });
  submission.update.mockResolvedValue(undefined);
  enqueueTrainIfIdle.mockResolvedValue(undefined);
  enqueueJob.mockResolvedValue({ id: "draft-1" });
  submission.findUnique.mockResolvedValue(takeSubmission);
  uploadGeminiFile.mockResolvedValue(uploadRef);
  const ai = { files: { delete: vi.fn() } };
  geminiClient.mockReturnValue(ai);
  deleteGeminiFile.mockResolvedValue(undefined);
});

describe("createGeminiJobUploadTracker", () => {
  it("deletes at most once", async () => {
    const tracker = createGeminiJobUploadTracker();
    tracker.track(uploadRef);
    const ai = { files: { delete: vi.fn() } };
    await tracker.deleteOnce(ai);
    await tracker.deleteOnce(ai);
    expect(deleteGeminiFile).toHaveBeenCalledTimes(1);
    expect(deleteGeminiFile).toHaveBeenCalledWith(ai, "files/child-video");
    expect(tracker.wasDeleted).toBe(true);
  });
});

describe("runAnalyze Gemini upload cleanup", () => {
  it("deletes when extract fails and there are no compare observations", async () => {
    vi.mocked(generateGeminiJson).mockRejectedValue(new Error('{"error":{"code":404}}'));

    await runAnalyze("sub-1");

    expect(deleteGeminiFile).toHaveBeenCalledTimes(1);
    expect(deleteGeminiFile).toHaveBeenCalledWith(expect.anything(), "files/child-video");
    const saved = analysis.create.mock.calls[0]?.[0]?.data;
    expect((saved?.metricsJson as { gemini_visual_error_code?: string }).gemini_visual_error_code).toBe(
      GEMINI_VISUAL_ERROR_CODES.unavailable,
    );
  });

  it("deletes when compare fails after extract succeeds", async () => {
    vi.mocked(generateGeminiJson)
      .mockResolvedValueOnce({
        data: { title: "Song", sections: [{ name: "A", chords: [], melodyNotes: [] }] },
        usage: { inputTokens: 1, outputTokens: 1 },
        model: "gemini-test",
      })
      .mockRejectedValueOnce(new Error("compare model 404"));

    await runAnalyze("sub-1");

    expect(deleteGeminiFile).toHaveBeenCalledTimes(1);
    expect(deleteGeminiFile).toHaveBeenCalledWith(expect.anything(), "files/child-video");
    const saved = analysis.create.mock.calls[0]?.[0]?.data;
    expect((saved?.metricsJson as { heard_extract?: unknown }).heard_extract).toBeTruthy();
  });

  it("deletes when the job throws after upload even on the unavailable path", async () => {
    vi.mocked(generateGeminiJson).mockRejectedValue(new Error('{"error":{"code":404}}'));
    analysis.create.mockRejectedValueOnce(new Error("db write failed"));

    await expect(runAnalyze("sub-1")).rejects.toThrow("db write failed");
    expect(deleteGeminiFile).toHaveBeenCalledTimes(1);
    expect(deleteGeminiFile).toHaveBeenCalledWith(expect.anything(), "files/child-video");
  });

  it("deletes only once when catch-up reuses the same upload", async () => {
    const practiceSubmission = { ...takeSubmission, kind: "practice" as const };
    submission.findUnique
      .mockResolvedValueOnce(practiceSubmission)
      .mockResolvedValue({ kind: "take", status: "received" });
    vi.mocked(generateGeminiJson)
      .mockResolvedValueOnce({
        data: { title: "Song", sections: [{ name: "A", chords: [], melodyNotes: [] }] },
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

    expect(uploadGeminiFile).toHaveBeenCalledTimes(1);
    expect(deleteGeminiFile).toHaveBeenCalledTimes(1);
    expect(deleteGeminiFile).toHaveBeenCalledWith(expect.anything(), "files/child-video");
  });
});