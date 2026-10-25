import { beforeEach, describe, expect, it, vi } from "vitest";

const job = vi.hoisted(() => ({
  updateMany: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: { job } }));

import { MAX_JOB_ATTEMPTS, pieceTrainKeepsFailing, reclaimStaleJobs, trainKeepsFailing } from "@/lib/jobs";

beforeEach(() => {
  job.updateMany.mockReset();
  job.findMany.mockReset();
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
