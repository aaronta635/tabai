import { beforeEach, describe, expect, it, vi } from "vitest";

const submission = vi.hoisted(() => ({ findFirst: vi.fn(), updateMany: vi.fn() }));
const followUp = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: { submission } }));
vi.mock("@/lib/jobs", () => ({ enqueueGeminiFollowUpIfPromoted: followUp }));
vi.mock("@/lib/student-cache", () => ({ revalidateStudentHotPath: vi.fn() }));

import { promotePracticeToTake } from "@/lib/promote-practice";

beforeEach(() => {
  submission.findFirst.mockReset();
  submission.updateMany.mockReset();
  followUp.mockReset();
});

describe("promotePracticeToTake", () => {
  it("turns a finished practice clip into a take and idempotently enqueues Gemini follow-up", async () => {
    submission.findFirst.mockResolvedValueOnce({
      id: "sub-1",
      kind: "practice",
      piece: { code: "song1" },
      submittedAt: new Date("2026-11-20T00:00:00.000Z"),
      jobs: [{ status: "done" }],
    });
    submission.updateMany.mockResolvedValueOnce({ count: 1 });
    followUp.mockResolvedValueOnce({ id: "job-2" });

    await expect(promotePracticeToTake({ studentId: "st-1", submissionId: "sub-1" })).resolves.toEqual({
      ok: true,
      id: "sub-1",
      already: false,
      pieceCode: "song1",
    });
    expect(submission.updateMany).toHaveBeenCalledWith({
      where: { id: "sub-1", studentId: "st-1", kind: "practice" },
      data: { kind: "take", submittedAt: expect.any(Date) },
    });
    expect(followUp).toHaveBeenCalledWith("sub-1", { fromPromotion: true });
  });

  it("does not record a second video when the clip is already a take", async () => {
    submission.findFirst.mockResolvedValueOnce({
      id: "sub-1",
      kind: "take",
      piece: { code: "song1" },
      submittedAt: new Date("2026-11-20T00:00:00.000Z"),
      jobs: [],
    });

    await expect(promotePracticeToTake({ studentId: "st-1", submissionId: "sub-1" })).resolves.toEqual({
      ok: true,
      id: "sub-1",
      already: true,
      pieceCode: "song1",
    });
    expect(submission.updateMany).not.toHaveBeenCalled();
    expect(followUp).not.toHaveBeenCalled();
  });

  it("treats a double promote as already sent", async () => {
    submission.findFirst
      .mockResolvedValueOnce({
        id: "sub-1",
        kind: "practice",
        piece: { code: "song1" },
        submittedAt: new Date("2026-11-20T00:00:00.000Z"),
        jobs: [{ status: "done" }],
      })
      .mockResolvedValueOnce({
        kind: "take",
        piece: { code: "song1" },
      });
    submission.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(promotePracticeToTake({ studentId: "st-1", submissionId: "sub-1" })).resolves.toEqual({
      ok: true,
      id: "sub-1",
      already: true,
      pieceCode: "song1",
    });
    expect(followUp).not.toHaveBeenCalled();
  });

  it("waits until the practice pitch job finishes", async () => {
    submission.findFirst.mockResolvedValueOnce({
      id: "sub-1",
      kind: "practice",
      submittedAt: new Date(),
      piece: { code: "song1" },
      jobs: [{ status: "running" }],
    });

    await expect(promotePracticeToTake({ studentId: "st-1", submissionId: "sub-1" })).resolves.toEqual({
      error: "analyze_open",
    });
    expect(submission.updateMany).not.toHaveBeenCalled();
  });

  it("still enqueues follow-up when analyze is in flight", async () => {
    submission.findFirst.mockResolvedValueOnce({
      id: "sub-1",
      kind: "practice",
      submittedAt: new Date(Date.now() - 61_000),
      piece: { code: "song1" },
      jobs: [{ status: "running" }],
    });
    submission.updateMany.mockResolvedValueOnce({ count: 1 });
    const open = { id: "job-open", status: "running" };
    followUp.mockResolvedValueOnce(open);

    await expect(promotePracticeToTake({ studentId: "st-1", submissionId: "sub-1" })).resolves.toEqual({
      ok: true,
      id: "sub-1",
      already: false,
      pieceCode: "song1",
    });
    expect(submission.updateMany).toHaveBeenCalled();
    expect(followUp).toHaveBeenCalledWith("sub-1", { fromPromotion: true });
  });
});