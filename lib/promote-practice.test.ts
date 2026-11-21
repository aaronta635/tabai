import { beforeEach, describe, expect, it, vi } from "vitest";

const submission = vi.hoisted(() => ({ findFirst: vi.fn(), updateMany: vi.fn() }));
const enqueue = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: { submission } }));
vi.mock("@/lib/jobs", () => ({ enqueueAnalyzeIfApproved: enqueue }));
vi.mock("@/lib/student-cache", () => ({ revalidateStudentHotPath: vi.fn() }));

import { promotePracticeToTake } from "@/lib/promote-practice";

beforeEach(() => {
  submission.findFirst.mockReset();
  submission.updateMany.mockReset();
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
    submission.updateMany.mockResolvedValueOnce({ count: 1 });
    enqueue.mockResolvedValueOnce({ id: "job-2" });

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
    expect(submission.updateMany).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
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
    expect(submission.updateMany).not.toHaveBeenCalled();
  });

  it("promotes during in-flight pitch check without queuing a second job", async () => {
    submission.findFirst.mockResolvedValueOnce({
      id: "sub-1",
      kind: "practice",
      submittedAt: new Date(Date.now() - 61_000),
      piece: { code: "song1" },
      jobs: [{ status: "running" }],
    });
    submission.updateMany.mockResolvedValueOnce({ count: 1 });
    const open = { id: "job-open", status: "running" };
    enqueue.mockResolvedValueOnce(open);

    await expect(promotePracticeToTake({ studentId: "st-1", submissionId: "sub-1" })).resolves.toEqual({
      ok: true,
      id: "sub-1",
      already: false,
      pieceCode: "song1",
    });
    expect(submission.updateMany).toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("queues analyze when practice pitch already finished", async () => {
    submission.findFirst.mockResolvedValueOnce({
      id: "sub-1",
      kind: "practice",
      submittedAt: new Date("2026-11-20T00:00:00.000Z"),
      piece: { code: "song1" },
      jobs: [{ status: "done" }],
    });
    submission.updateMany.mockResolvedValueOnce({ count: 1 });
    enqueue.mockResolvedValueOnce({ id: "job-take", status: "pending" });

    await promotePracticeToTake({ studentId: "st-1", submissionId: "sub-1" });

    expect(enqueue).toHaveBeenCalledWith("sub-1");
  });
});