import { describe, expect, it } from "vitest";
import { resolveAuthBind } from "@/lib/auth-bind";

describe("resolveAuthBind", () => {
  it("keeps a teacher off the student sign-in path", () => {
    expect(
      resolveAuthBind({
        requested: "student",
        hasTeacher: true,
        hasStudent: false,
        fallbackRole: "student",
      }),
    ).toEqual({ action: "mismatch", actual: "tutor" });
  });

  it("keeps a student off the teacher sign-in path", () => {
    expect(
      resolveAuthBind({
        requested: "tutor",
        hasTeacher: false,
        hasStudent: true,
        fallbackRole: "tutor",
      }),
    ).toEqual({ action: "mismatch", actual: "student" });
  });

  it("opens the matching profile when one already exists", () => {
    expect(
      resolveAuthBind({
        requested: "student",
        hasTeacher: false,
        hasStudent: true,
        fallbackRole: "tutor",
      }),
    ).toEqual({ action: "use", role: "student" });
    expect(
      resolveAuthBind({
        requested: "tutor",
        hasTeacher: true,
        hasStudent: false,
        fallbackRole: "student",
      }),
    ).toEqual({ action: "use", role: "tutor" });
  });

  it("creates the role from the screen the person used", () => {
    expect(
      resolveAuthBind({
        requested: "student",
        hasTeacher: false,
        hasStudent: false,
        fallbackRole: "tutor",
      }),
    ).toEqual({ action: "create", role: "student" });
    expect(
      resolveAuthBind({
        requested: "tutor",
        hasTeacher: false,
        hasStudent: false,
        fallbackRole: "student",
      }),
    ).toEqual({ action: "create", role: "tutor" });
  });

  it("prefers a student profile when both exist and student login was used", () => {
    expect(
      resolveAuthBind({
        requested: "student",
        hasTeacher: true,
        hasStudent: true,
        fallbackRole: "tutor",
      }),
    ).toEqual({ action: "use", role: "student" });
  });

  it("falls back to an existing profile when no role was requested", () => {
    expect(
      resolveAuthBind({
        requested: null,
        hasTeacher: true,
        hasStudent: false,
        fallbackRole: "student",
      }),
    ).toEqual({ action: "use", role: "tutor" });
    expect(
      resolveAuthBind({
        requested: null,
        hasTeacher: false,
        hasStudent: true,
        fallbackRole: "tutor",
      }),
    ).toEqual({ action: "use", role: "student" });
    expect(
      resolveAuthBind({
        requested: null,
        hasTeacher: false,
        hasStudent: false,
        fallbackRole: "student",
      }),
    ).toEqual({ action: "create", role: "student" });
  });
});
