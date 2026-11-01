import { beforeEach, describe, expect, it, vi } from "vitest";

const submission = vi.hoisted(() => ({ findUnique: vi.fn() }));
const job = vi.hoisted(() => ({
  updateMany: vi.fn(),
  findMany: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: { submission, job } }));

import {
  enqueueAnalyzeIfApproved,
  MAX_JOB_ATTEMPTS,
  pieceTrainKeepsFailing,
  reclaimStaleJobs,
  trainKeepsFailing,
} from "@/lib/jobs";

beforeEach(() => {
  submission.findUnique.mockReset();
  job.updateMany.mockReset();
  job.findMany.mockReset();
  job.findFirst.mockReset();
  job.create.mockReset();
});

describe("reclaimStaleJobs", () => {
  it("fails stuck jobs that used every attempt and requeues the rest", async () => {
    job.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 2 });

    await expect(reclaimStaleJobs()).resolves.toBe(2);

    const [exhausted, requeue] = job.updateMany.mock.calls.map(([args]) => args);
    expect(exhausted.where).toMatchObject({ status: "running", attempts: { gte: MAX_JOB_ATTEMPTS } });
    expect(exhausted.data.status).toBe("failed");
    expect(requeue.where).toMatchObject({ status: "running", attempts: { lt: MAX_JOB_ATTEMPTS } });
    expect(requeue.data).toEqual({ status: "pending" });
  });

  it("leaves failed jobs alone", async () => {
    job.updateMany.mockResolvedValue({ count: 0 });

    await reclaimStaleJobs();

    for (const [args] of job.updateMany.mock.calls) {
      expect(args.where.status).toBe("running");
    }
  });
});

describe("trainKeepsFailing", () => {
  it("is true only when the last three train jobs all failed", () => {
    expect(trainKeepsFailing(["failed", "failed", "failed"])).toBe(true);
    expect(trainKeepsFailing(["failed", "failed"])).toBe(false);
    expect(trainKeepsFailing(["done", "failed", "failed", "failed"])).toBe(false);
    expect(trainKeepsFailing(["failed", "failed", "done"])).toBe(false);
  });

  it("reads this piece's newest train jobs", async () => {
    job.findMany.mockResolvedValueOnce([{ status: "failed" }, { status: "failed" }, { status: "failed" }]);

    await expect(pieceTrainKeepsFailing("piece-1")).resolves.toBe(true);
    expect(job.findMany.mock.calls[0][0]).toMatchObject({
      where: { type: "train_piece", payload: { path: ["pieceId"], equals: "piece-1" } },
      orderBy: { createdAt: "desc" },
    });
  });
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
