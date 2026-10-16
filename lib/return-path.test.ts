import { describe, expect, it } from "vitest";
import {
  destinationAfterAuth,
  inviteTokenFromReturn,
  safeReturn,
  signInPath,
  studioReturn,
} from "@/lib/return-path";

describe("safeReturn", () => {
  it("keeps a studio path and its query for the matching role", () => {
    expect(safeReturn("student", "/student/takes/abc?x=1")).toBe("/student/takes/abc?x=1");
    expect(safeReturn("tutor", "/teacher/submissions/abc")).toBe("/teacher/submissions/abc");
  });

  it("drops the other role, open redirects, and auth", () => {
    expect(safeReturn("student", "/teacher/roster")).toBeNull();
    expect(safeReturn("tutor", "/student/takes")).toBeNull();
    expect(safeReturn("student", "//evil.example/student")).toBeNull();
    expect(safeReturn("student", "/student/../auth")).toBeNull();
    expect(safeReturn("tutor", "/teacher\\@evil.example")).toBeNull();
    expect(safeReturn("student", "/student/%2f%2e%2e")).toBeNull();
    expect(safeReturn("tutor", "/auth?role=tutor")).toBeNull();
    expect(safeReturn("tutor", "/teachers")).toBeNull();
  });

  it("allows one class code and one invite token", () => {
    expect(safeReturn("student", "/join/abcd23")).toBe("/join/abcd23");
    expect(safeReturn("student", "/c/abcd23")).toBe("/c/abcd23");
    expect(safeReturn("student", "/join/abcd23/extra")).toBeNull();
    expect(safeReturn("tutor", "/t/abcdefghijklmnopqrstuvwx")).toBe("/t/abcdefghijklmnopqrstuvwx");
    expect(safeReturn("tutor", "/t/abcdefghijklmnopqrstuvwx?next=/teacher")).toBe(
      "/t/abcdefghijklmnopqrstuvwx",
    );
    expect(safeReturn("student", "/t/abcdefghijklmnopqrstuvwx")).toBeNull();
  });
});

describe("studioReturn", () => {
  it("keeps studio pages and drops invite and class links", () => {
    expect(studioReturn("tutor", "/teacher/roster")).toBe("/teacher/roster");
    expect(studioReturn("tutor", "/t/abcdefghijklmnopqrstuvwx")).toBeNull();
    expect(studioReturn("student", "/join/abcd23")).toBeNull();
  });
});

describe("inviteTokenFromReturn", () => {
  it("reads the token only from a tutor invite path", () => {
    expect(inviteTokenFromReturn("/t/abcdefghijklmnopqrstuvwx")).toBe("abcdefghijklmnopqrstuvwx");
    expect(inviteTokenFromReturn("/teacher/abcdefghijklmnopqrstuvwx")).toBeNull();
    expect(inviteTokenFromReturn("/student/takes")).toBeNull();
  });
});

describe("signInPath", () => {
  it("always names the role and keeps a safe return", () => {
    expect(signInPath("tutor", "/teacher/submissions/1")).toBe(
      "/login/teacher?next=%2Fteacher%2Fsubmissions%2F1",
    );
    expect(signInPath("student", "/student")).toBe("/login/student");
    expect(signInPath("student", "//evil.example")).toBe("/login/student");
  });
});

describe("destinationAfterAuth", () => {
  it("sends an onboarded student back to the page they opened", () => {
    expect(
      destinationAfterAuth({
        role: "student",
        onboarded: true,
        requested: "/student/takes/abc",
        home: "/student",
      }),
    ).toBe("/student/takes/abc");
  });

  it("holds a studio return through onboarding and does not return to an invite", () => {
    expect(
      destinationAfterAuth({
        role: "tutor",
        onboarded: false,
        requested: "/teacher/roster",
        home: "/onboarding",
      }),
    ).toBe("/onboarding?next=%2Fteacher%2Froster");
    expect(
      destinationAfterAuth({
        role: "tutor",
        onboarded: true,
        requested: "/t/abcdefghijklmnopqrstuvwx",
        home: "/teacher",
      }),
    ).toBe("/teacher");
    expect(
      destinationAfterAuth({
        role: "tutor",
        onboarded: false,
        requested: "/t/abcdefghijklmnopqrstuvwx",
        home: "/onboarding",
      }),
    ).toBe("/onboarding");
  });
});
