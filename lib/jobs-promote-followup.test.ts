import { beforeEach, describe, expect, it, vi } from "vitest";
import { GEMINI_VISUAL_ERROR_CODES } from "@/lib/gemini-visual";

const submission = vi.hoisted(() => ({ findUnique: vi.fn() }));
const prismaJob = vi.hoisted(() => ({
  findFirst: vi.fn(),
  create: vi.fn(),
}));
const transaction = vi.hoisted(() => vi.fn());

const getReadyPieceModel = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    submission,
    job: prismaJob,
    $transaction: transaction,
  },
}));
vi.mock("@/lib/catalog", () => ({ getReadyPieceModel }));
vi.mock("@/lib/cloud-worker", () => ({ wakeCloudWorker: vi.fn() }));

import {
  enqueueGeminiFollowUpIfPromoted,
  PROMOTE_GEMINI_FOLLOW_UP,
  promoteGeminiFollowUpEligible,
} from "@/lib/jobs-promote-followup";

beforeEach(() => {
  vi.clearAllMocks();
  transaction.mockImplementation(async (fn: (tx: { job: typeof prismaJob; $executeRaw: ReturnType<typeof vi.fn> }) => unknown) =>
    fn({ job: prismaJob, $executeRaw: vi.fn() }),
  );
});

describe("promoteGeminiFollowUpEligible", () => {
  it("requires promotion context or a practice-origin finish", () => {
    expect(promoteGeminiFollowUpEligible({})).toBe(false);
    expect(promoteGeminiFollowUpEligible({ fromPromotion: true })).toBe(true);
    expect(promoteGeminiFollowUpEligible({ finishingStartedAsPractice: true })).toBe(true);
    expect(promoteGeminiFollowUpEligible({ finishingWasPromoteFollowUp: true })).toBe(false);
  });
});

describe("enqueueGeminiFollowUpIfPromoted", () => {
  const baseRow = {
    id: "sub-1",
    kind: "take" as const,
    student: { approvedAt: new Date("2026-10-22") },
    piece: { demo: false, id: "piece-1" },
    analyses: [{ metricsJson: { pitch_notes: [] }, observationsJson: null }],
  };

  it("does nothing without promotion or practice-origin context", async () => {
    await expect(enqueueGeminiFollowUpIfPromoted("sub-1")).resolves.toBeNull();
    expect(submission.findUnique).not.toHaveBeenCalled();
  });

  it("skips when the latest analysis already has a Gemini visual error code", async () => {
    submission.findUnique.mockResolvedValueOnce({
      ...baseRow,
      analyses: [
        {
          metricsJson: { gemini_visual_error_code: GEMINI_VISUAL_ERROR_CODES.upload_failed },
          observationsJson: null,
        },
      ],
    });

    await expect(
      enqueueGeminiFollowUpIfPromoted("sub-1", { finishingStartedAsPractice: true }),
    ).resolves.toBeNull();
    expect(prismaJob.findFirst).not.toHaveBeenCalled();
  });

  it("creates one flagged follow-up inside a transaction", async () => {
    submission.findUnique.mockResolvedValueOnce(baseRow);
    getReadyPieceModel.mockResolvedValueOnce({ id: "pm-1" });
    prismaJob.findFirst.mockResolvedValueOnce(null);
    prismaJob.findFirst.mockResolvedValueOnce(null);
    prismaJob.create.mockResolvedValueOnce({ id: "job-follow", status: "pending" });

    const created = await enqueueGeminiFollowUpIfPromoted("sub-1", { fromPromotion: true });
    expect(created).toMatchObject({ id: "job-follow" });
    expect(prismaJob.create).toHaveBeenCalledWith({
      data: {
        type: "analyze",
        submissionId: "sub-1",
        payload: { submissionId: "sub-1", [PROMOTE_GEMINI_FOLLOW_UP]: true },
      },
    });
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it("reuses an existing promote follow-up instead of creating another", async () => {
    submission.findUnique.mockResolvedValueOnce(baseRow);
    getReadyPieceModel.mockResolvedValueOnce({ id: "pm-1" });
    prismaJob.findFirst.mockResolvedValueOnce(null);
    const prior = { id: "job-old", status: "done", payload: { promoteGeminiFollowUp: true } };
    prismaJob.findFirst.mockResolvedValueOnce(prior);

    await expect(enqueueGeminiFollowUpIfPromoted("sub-1", { fromPromotion: true })).resolves.toEqual(prior);
    expect(prismaJob.create).not.toHaveBeenCalled();
  });

  it("does not enqueue when visual output is already complete", async () => {
    submission.findUnique.mockResolvedValueOnce({
      ...baseRow,
      analyses: [
        {
          metricsJson: { heard_extract: { title: "T" } },
          observationsJson: { overallFit: 1, confidence: 1, positives: [], issues: [], nextPractice: "" },
        },
      ],
    });
    getReadyPieceModel.mockResolvedValueOnce({ id: "pm-1" });

    await expect(enqueueGeminiFollowUpIfPromoted("sub-1", { fromPromotion: true })).resolves.toBeNull();
    expect(transaction).not.toHaveBeenCalled();
  });
});