import { jwtVerify, SignJWT } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  currentTeacherSession,
  homeTeacherId,
  signStudentSession,
  signTeacherSession,
  TEACHER_SESSION_VERSION,
} from "@/lib/auth";

const secret = new TextEncoder().encode("test-secret-value");

describe("teacher session version", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stamps new teacher cookies with the current version", async () => {
    vi.stubEnv("SESSION_SECRET", "test-secret-value");
    const token = await signTeacherSession("teacher-1", "Ada", true);
    const { payload } = await jwtVerify(token, secret);
    expect(payload.sv).toBe(TEACHER_SESSION_VERSION);
    expect(currentTeacherSession(payload.sv)).toBe(true);
  });

  it("rejects a teacher cookie minted before the version claim", async () => {
    const token = await new SignJWT({
      typ: "teacher",
      teacherId: "teacher-1",
      name: "Ada",
      onboarded: true,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);
    const { payload } = await jwtVerify(token, secret);
    expect(currentTeacherSession(payload.sv)).toBe(false);
  });
});

describe("student session claims", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stamps signed-in student cookies with the auth user id", async () => {
    vi.stubEnv("SESSION_SECRET", "test-secret-value");
    const token = await signStudentSession("student-a", "An", true, "auth-a");
    const { payload } = await jwtVerify(token, secret);
    expect(payload.typ).toBe("student");
    expect(payload.studentId).toBe("student-a");
    expect(payload.authUserId).toBe("auth-a");
  });

  it("keeps guest student cookies unbound to an auth user", async () => {
    vi.stubEnv("SESSION_SECRET", "test-secret-value");
    const token = await signStudentSession("student-b", "Binh", true);
    const { payload } = await jwtVerify(token, secret);
    expect(payload.authUserId).toBeUndefined();
  });
});

describe("homeTeacherId", () => {
  it("keeps the student's home studio when they open another teacher's piece", () => {
    expect(homeTeacherId("teacher-a", "teacher-b")).toBe("teacher-a");
    expect(homeTeacherId(null, "teacher-b")).toBe("teacher-b");
  });
});
