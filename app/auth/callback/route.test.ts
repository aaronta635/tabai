import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  bindAuthSession: vi.fn(),
  signOutAccount: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  bindAuthSession: auth.bindAuthSession,
  signOutAccount: auth.signOutAccount,
  isRoleMismatch: (value: unknown) =>
    Boolean(value && typeof value === "object" && "error" in value),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: async () => ({
    auth: { exchangeCodeForSession: auth.exchangeCodeForSession },
  }),
}));

import { GET } from "@/app/auth/callback/route";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    auth.bindAuthSession.mockReset();
    auth.signOutAccount.mockReset();
    auth.exchangeCodeForSession.mockReset();
    auth.bindAuthSession.mockResolvedValue({ error: "role_mismatch", actual: "tutor" });
  });

  it("does not sign the account out when the link has no sign-in code", async () => {
    const response = await GET(new NextRequest("https://app.paramuzic.com/auth/callback?role=student"));
    const location = new URL(response.headers.get("location") ?? "");

    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(auth.signOutAccount).not.toHaveBeenCalled();
    expect(location.pathname).toBe("/login/student");
    expect(location.searchParams.get("error")).toBe("role_mismatch");
  });

  it("signs out after a real code exchange that landed on the wrong role", async () => {
    await GET(new NextRequest("https://app.paramuzic.com/auth/callback?role=student&code=abc"));

    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(auth.signOutAccount).toHaveBeenCalledTimes(1);
  });
});
