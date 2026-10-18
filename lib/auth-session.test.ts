import { jwtVerify, SignJWT } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { currentTeacherSession, signTeacherSession, TEACHER_SESSION_VERSION } from "@/lib/auth";

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
