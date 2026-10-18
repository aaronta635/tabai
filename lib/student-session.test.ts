import { describe, expect, it } from "vitest";
import { jwtMatchesAuthUser, resolveStudentStudioSession } from "@/lib/student-session";

const leftoverGuest = {
  studentId: "student-b",
  name: "Binh",
  onboarded: true,
  authUserId: null,
};

const leftoverSignedIn = {
  studentId: "student-b",
  name: "Binh",
  onboarded: true,
  authUserId: "auth-b",
};

const studentA = {
  id: "student-a",
  name: "An",
  onboardedAt: new Date("2026-01-01"),
  authUserId: "auth-a",
};

describe("resolveStudentStudioSession", () => {
  it("ignores leftover student B cookies when student A is signed in", () => {
    expect(
      resolveStudentStudioSession({
        authUserId: "auth-a",
        jwt: leftoverGuest,
        authStudent: studentA,
      }),
    ).toEqual({ id: "student-a", name: "An", onboarded: true });

    expect(
      resolveStudentStudioSession({
        authUserId: "auth-a",
        jwt: leftoverSignedIn,
        authStudent: studentA,
      }),
    ).toEqual({ id: "student-a", name: "An", onboarded: true });
  });

  it("does not keep showing student B after A signs in but has no student row yet", () => {
    expect(
      resolveStudentStudioSession({
        authUserId: "auth-a",
        jwt: leftoverGuest,
        authStudent: null,
      }),
    ).toBeNull();
  });

  it("reuses the JWT when it is stamped with the same auth user id", () => {
    const jwt = {
      studentId: "student-a",
      name: "An",
      onboarded: true,
      authUserId: "auth-a",
    };
    expect(jwtMatchesAuthUser(jwt, "auth-a")).toBe(true);
    expect(
      resolveStudentStudioSession({
        authUserId: "auth-a",
        jwt,
        authStudent: null,
      }),
    ).toEqual({ id: "student-a", name: "An", onboarded: true });
  });

  it("keeps a guest JWT only when nobody is signed in", () => {
    expect(
      resolveStudentStudioSession({
        authUserId: null,
        jwt: leftoverGuest,
        authStudent: null,
      }),
    ).toEqual({ id: "student-b", name: "Binh", onboarded: true });

    expect(
      resolveStudentStudioSession({
        authUserId: null,
        jwt: leftoverSignedIn,
        authStudent: null,
      }),
    ).toBeNull();
  });
});
