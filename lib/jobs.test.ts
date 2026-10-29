import { beforeEach, describe, expect, it, vi } from "vitest";

const submission = vi.hoisted(() => ({ findUnique: vi.fn() }));
const job = vi.hoisted(() => ({ findFirst: vi.fn(), create: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: { submission, job } }));

import { enqueueAnalyzeIfApproved } from "@/lib/jobs";

beforeEach(() => {
  submission.findUnique.mockReset();
  job.findFirst.mockReset();
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
