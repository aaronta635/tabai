import { beforeEach, describe, expect, it, vi } from "vitest";

const submission = vi.hoisted(() => ({ findUnique: vi.fn(), findMany: vi.fn() }));
const job = vi.hoisted(() => ({ findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: { submission, job } }));

import { enqueueAnalyzeIfApproved, enqueueDraftWhenReady, enqueueTakesNeedingCompare } from "@/lib/jobs";

beforeEach(() => {
  submission.findUnique.mockReset();
  submission.findMany.mockReset();
  job.findFirst.mockReset();
  job.findMany.mockReset();
  job.create.mockReset();
});

describe("enqueueAnalyzeIfApproved", () => {
  it("reuses a pending or running analyze job", async () => {
    submission.findUnique.mockResolvedValueOnce({
      id: "sub-1",
      student: { approvedAt: new Date("2026-10-22") },
      piece: { demo: false },
    });
    const open = { id: "job-open", status: "running" };
    job.findFirst.mockResolvedValueOnce(open);

    await expect(enqueueAnalyzeIfApproved("sub-1")).resolves.toEqual(open);
    expect(job.create).not.toHaveBeenCalled();
  });

  it("creates one analyze job when none is open", async () => {
    submission.findUnique.mockResolvedValueOnce({
      id: "sub-1",
      student: { approvedAt: new Date("2026-10-22") },
      piece: { demo: false },
    });
    job.findFirst.mockResolvedValueOnce(null);
    job.create.mockResolvedValueOnce({ id: "job-new", status: "pending" });

    await expect(enqueueAnalyzeIfApproved("sub-1")).resolves.toMatchObject({ id: "job-new" });
    expect(job.create).toHaveBeenCalledWith({
      data: { type: "analyze", payload: { submissionId: "sub-1" }, submissionId: "sub-1" },
    });
  });

  it("skips unapproved students", async () => {
    submission.findUnique.mockResolvedValueOnce({
      id: "sub-1",
      student: { approvedAt: null },
      piece: { demo: false },
    });

    await expect(enqueueAnalyzeIfApproved("sub-1")).resolves.toBeNull();
    expect(job.findFirst).not.toHaveBeenCalled();
    expect(job.create).not.toHaveBeenCalled();
  });

  it("queues a demo take that has not been approved", async () => {
    submission.findUnique.mockResolvedValueOnce({
      id: "sub-1",
      student: { approvedAt: null },
      piece: { demo: true },
    });
    job.findFirst.mockResolvedValueOnce(null);
    job.create.mockResolvedValueOnce({ id: "job-demo", status: "pending" });

    await expect(enqueueAnalyzeIfApproved("sub-1")).resolves.toMatchObject({ id: "job-demo" });
  });
});

describe("enqueueDraftWhenReady", () => {
  const readyFacts = {
    confidence: 0.8,
    issues: [{ tStart: 1, verdict: "true", type: "pitch", expected: "G", observed: "G" }],
  };

  it("queues a letter for a demo take before the student is approved", async () => {
    submission.findUnique.mockResolvedValueOnce({
      id: "sub-1",
      status: "new",
      kind: "take",
      piece: { demo: true },
      student: { approvedAt: null },
      analyses: [{ observationsJson: readyFacts }],
    });
    job.findFirst.mockResolvedValueOnce(null);
    job.create.mockResolvedValueOnce({ id: "draft-1", status: "pending" });

    await expect(enqueueDraftWhenReady("sub-1")).resolves.toMatchObject({ id: "draft-1" });
    expect(job.create).toHaveBeenCalledWith({
      data: { type: "draft", payload: { submissionId: "sub-1" }, submissionId: "sub-1" },
    });
  });

  it("holds a class take until the student is approved", async () => {
    submission.findUnique.mockResolvedValueOnce({
      id: "sub-1",
      status: "new",
      kind: "take",
      piece: { demo: false },
      student: { approvedAt: null },
      analyses: [{ observationsJson: readyFacts }],
    });

    await expect(enqueueDraftWhenReady("sub-1")).resolves.toBeNull();
    expect(job.create).not.toHaveBeenCalled();
  });
});

describe("enqueueTakesNeedingCompare", () => {
  it("includes a demo take before the student is approved", async () => {
    submission.findMany.mockResolvedValueOnce([]);
    job.findMany.mockResolvedValueOnce([]);

    await enqueueTakesNeedingCompare("piece-1");

    expect(submission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          pieceId: "piece-1",
          OR: [{ student: { approvedAt: { not: null } } }, { piece: { demo: true } }],
        }),
      }),
    );
  });
});
