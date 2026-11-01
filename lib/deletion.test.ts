import { beforeEach, describe, expect, it, vi } from "vitest";

const student = vi.hoisted(() => ({
  findUnique: vi.fn(),
  delete: vi.fn(),
  updateMany: vi.fn(),
}));
const submission = vi.hoisted(() => ({ count: vi.fn() }));
const job = vi.hoisted(() => ({ deleteMany: vi.fn() }));
const event = vi.hoisted(() => ({ deleteMany: vi.fn() }));
const media = vi.hoisted(() => ({ deleteMany: vi.fn() }));
const deleteUser = vi.hoisted(() => vi.fn(async () => ({ error: null })));

vi.mock("@/lib/prisma", () => ({
  prisma: { student, submission, job, event, media },
}));
vi.mock("@/lib/storage", () => ({
  removeMedia: vi.fn(),
  supabaseAdmin: () => ({ auth: { admin: { deleteUser } } }),
}));
vi.mock("@/lib/events", () => ({ logEvent: vi.fn() }));

import { deleteStudentData } from "@/lib/deletion";

beforeEach(() => {
  student.findUnique.mockReset();
  student.delete.mockReset();
  submission.count.mockReset();
  job.deleteMany.mockReset();
  event.deleteMany.mockReset();
  media.deleteMany.mockReset();
  deleteUser.mockClear();
});

describe("deleteStudentData", () => {
  it("deletes the student and the sign-in instead of keeping an anonymised user", async () => {
    student.findUnique.mockResolvedValue({
      id: "student-1",
      authUserId: "auth-1",
      submissions: [
        {
          id: "take-1",
          mediaId: "media-1",
          pieceId: "piece-1",
          studentId: "student-1",
          media: {
            id: "media-1",
            storagePath: "teachers/teacher-1/pieces/piece-1/students/student-1/take.webm",
          },
          piece: {
            teacherId: "teacher-1",
            sheetMediaId: null,
            tutorialMediaId: null,
            clipMediaId: null,
            referenceMediaId: null,
          },
        },
      ],
    });
    submission.count.mockResolvedValue(0);
    student.delete.mockResolvedValue({});
    job.deleteMany.mockResolvedValue({});
    event.deleteMany.mockResolvedValue({});
    media.deleteMany.mockResolvedValue({});

    await deleteStudentData("student-1");

    expect(student.delete).toHaveBeenCalledWith({ where: { id: "student-1" } });
    expect(deleteUser).toHaveBeenCalledWith("auth-1");
    expect(event.deleteMany).toHaveBeenCalledWith({ where: { actorId: "student-1" } });
    expect(media.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ["media-1"] } } });
  });
});
