import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  bindAuthSession: vi.fn(),
  signOutAccount: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  bindAuthSession: auth.bindAuthSession,
  signOutAccount: auth.signOutAccount,
  isRoleMismatch: (value: unknown) =>
    Boolean(value && typeof value === "object" && "error" in value),
}));

import { GET } from "@/app/api/session/route";

describe("GET /api/session", () => {
  beforeEach(() => {
    auth.bindAuthSession.mockReset();
    auth.signOutAccount.mockReset();
  });

  it("never opens the teacher studio from a student request", async () => {
    auth.bindAuthSession.mockResolvedValueOnce({ error: "role_mismatch", actual: "tutor" });

    const response = await GET(new NextRequest("https://app.paramuzic.com/api/session?role=student"));
    const location = new URL(response.headers.get("location") ?? "");

    expect(auth.bindAuthSession).toHaveBeenCalledTimes(1);
    expect(location.pathname).toBe("/login/student");
    expect(location.searchParams.get("error")).toBe("role_mismatch");
  });

  it("does not sign the account out from a plain link", async () => {
    auth.bindAuthSession.mockResolvedValueOnce({ error: "role_mismatch", actual: "tutor" });

    await GET(new NextRequest("https://app.paramuzic.com/api/session?role=student"));

    expect(auth.signOutAccount).not.toHaveBeenCalled();
  });

  it("sends a matching role to its studio", async () => {
    auth.bindAuthSession.mockResolvedValueOnce({ role: "student", onboarded: true, next: "/student" });

    const response = await GET(new NextRequest("https://app.paramuzic.com/api/session?role=student"));

    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/student");
  });
});
