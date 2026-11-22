import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  pieceFind: vi.fn(),
  studentCreate: vi.fn(async () => ({ id: "new-stu", token: "tok" })),
  studentUpdate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    piece: { findUnique: db.pieceFind },
    student: { create: db.studentCreate, update: db.studentUpdate },
  },
}));

vi.mock("@/lib/auth", () => ({
  studentForPiece: vi.fn(async () => ({ fromSession: false, student: null, otherClass: false })),
  newStudentToken: () => "tok",
  setStudentCookie: vi.fn(async () => {}),
  setStudentAccountCookies: vi.fn(async () => {}),
  homeTeacherId: vi.fn(),
}));

vi.mock("@/lib/events", () => ({ logEvent: vi.fn(async () => {}) }));
vi.mock("@/lib/report", () => ({ newReportToken: () => "report" }));
vi.mock("@/lib/student-phone", () => ({ phoneIsTaken: vi.fn(async () => false) }));
vi.mock("@/lib/demo-piece", () => ({ shouldAttachTeacher: () => true }));

import { POST } from "./route";

function post(body: Record<string, unknown>, locale: "vi" | "en" = "vi") {
  return new NextRequest("http://localhost/api/l/demo/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-locale": locale },
    body: JSON.stringify(body),
  });
}

describe("POST /api/l/[code]/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.pieceFind.mockResolvedValue({ teacherId: "t1", demo: false, archived: false });
  });

  it("refuses a Messenger link instead of a phone number", async () => {
    const response = await POST(
      post({
        name: "An",
        ageBand: "adult",
        contactHandle: "https://m.me/para.student",
        consent: true,
      }),
      { params: Promise.resolve({ code: "demo" }) },
    );
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.fields?.contactHandle).toBe(true);
    expect(db.studentCreate).not.toHaveBeenCalled();
  });

  it("stores a valid Vietnamese phone for new students", async () => {
    const response = await POST(
      post({ name: "An", ageBand: "adult", contactHandle: "0912 345 678", consent: true }, "vi"),
      { params: Promise.resolve({ code: "demo" }) },
    );
    expect(response.status).toBe(200);
    expect(db.studentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contactType: "zalo",
        contactHandle: "0912 345 678",
        phoneKey: "84912345678",
      }),
    });
  });
});