import { beforeEach, describe, expect, it, vi } from "vitest";

const submission = vi.hoisted(() => ({ findFirst: vi.fn(), update: vi.fn() }));
const enqueue = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: { submission } }));
vi.mock("@/lib/jobs", () => ({ enqueueAnalyzeIfApproved: enqueue }));
vi.mock("@/lib/student-cache", () => ({ revalidateStudentHotPath: vi.fn() }));

import { promotePracticeToTake } from "@/lib/promote-practice";

beforeEach(() => {
  submission.findFirst.mockReset();
  submission.update.mockReset();
  enqueue.mockReset();
});

describe("promotePracticeToTake", () => {
  it("turns a finished practice clip into a take and re-queues analyze", async () => {
    submission.findFirst.mockResolvedValueOnce({
      id: "sub-1",
      kind: "practice",
      piece: { code: "song1" },
      submittedAt: new Date("2026-11-20T00:00:00.000Z"),
      jobs: [{ status: "done" }],
    });
    submission.update.mockResolvedValueOnce({ id: "sub-1" });
    enqueue.mockResolvedValueOnce({ id: "job-2" });

    await expect(promotePracticeToTake({ studentId: "st-1", submissionId: "sub-1" })).resolves.toEqual({
      ok: true,
      id: "sub-1",
      already: false,
      pieceCode: "song1",
    });
    expect(submission.update).toHaveBeenCalledWith({
      where: { id: "sub-1" },
      data: { kind: "take", submittedAt: expect.any(Date) },
    });
    expect(enqueue).toHaveBeenCalledWith("sub-1");
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
    expect(submission.update).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
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
    expect(submission.update).not.toHaveBeenCalled();
  });

  it("lets them send after the pitch wait even if analyze is still open", async () => {
    submission.findFirst.mockResolvedValueOnce({
      id: "sub-1",
      kind: "practice",
      submittedAt: new Date(Date.now() - 61_000),
      piece: { code: "song1" },
      jobs: [{ status: "running" }],
    });
    submission.update.mockResolvedValueOnce({ id: "sub-1" });
    enqueue.mockResolvedValueOnce({ id: "job-open" });

    await expect(promotePracticeToTake({ studentId: "st-1", submissionId: "sub-1" })).resolves.toEqual({
      ok: true,
      id: "sub-1",
      already: false,
      pieceCode: "song1",
    });
    expect(submission.update).toHaveBeenCalled();
  });
});
