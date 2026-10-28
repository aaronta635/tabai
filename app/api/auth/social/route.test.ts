import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { encodeSocialPending, SOCIAL_OAUTH_COOKIE, zaloAppSecretProof } from "@/lib/social-oauth";

const session = vi.hoisted(() => ({
  establishSocialSession: vi.fn(async () => {}),
}));

vi.mock("@/lib/social-session", () => ({
  establishSocialSession: session.establishSocialSession,
}));

import { GET as callback } from "@/app/api/auth/social/[provider]/callback/route";
import { GET as start } from "@/app/api/auth/social/[provider]/start/route";

const pending = {
  provider: "zalo" as const,
  state: "state-1",
  verifier: "verifier-1",
  role: "student" as const,
  next: "/student",
  from: "login" as const,
};

describe("social OAuth routes", () => {
  beforeEach(() => {
    session.establishSocialSession.mockClear();
    process.env.ZALO_APP_ID = "zalo-app";
    process.env.ZALO_APP_SECRET = "zalo-secret";
    process.env.FACEBOOK_APP_ID = "fb-app";
    process.env.FACEBOOK_APP_SECRET = "fb-secret";
  });

  it("redirects Zalo login to the permission screen and stores the verifier", async () => {
    const response = await start(
      new NextRequest("https://paramuzic.com/api/auth/social/zalo/start?role=student&next=/student&from=login"),
      { params: Promise.resolve({ provider: "zalo" }) },
    );
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.origin + location.pathname).toBe("https://oauth.zaloapp.com/v4/permission");
    expect(location.searchParams.get("app_id")).toBe("zalo-app");
    expect(location.searchParams.get("redirect_uri")).toBe(
      "https://paramuzic.com/api/auth/social/zalo/callback",
    );
    expect(location.searchParams.get("code_challenge")).toBeTruthy();
    const stored = response.cookies.get(SOCIAL_OAUTH_COOKIE)?.value;
    expect(stored).toContain("verifier");
  });

  it("sends a missing app id back to the role sign-in page", async () => {
    delete process.env.FACEBOOK_APP_ID;
    const response = await start(
      new NextRequest("https://paramuzic.com/api/auth/social/facebook/start?role=tutor&from=signup"),
      { params: Promise.resolve({ provider: "facebook" }) },
    );
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/signup/teacher");
    expect(location.searchParams.get("error")).toBe("provider");
  });

  it("exchanges a Zalo code and opens the studio callback for that role", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "tok" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 0, id: "99", name: "Lan" }),
      });
    vi.stubGlobal("fetch", fetchImpl);

    const response = await callback(
      new NextRequest("https://paramuzic.com/api/auth/social/zalo/callback?code=code-1&state=state-1", {
        headers: { cookie: `${SOCIAL_OAUTH_COOKIE}=${encodeSocialPending(pending)}` },
      }),
      { params: Promise.resolve({ provider: "zalo" }) },
    );

    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/auth/callback");
    expect(location.searchParams.get("role")).toBe("student");
    expect(location.searchParams.get("next")).toBe("/student");
    expect(session.establishSocialSession).toHaveBeenCalledWith(
      expect.anything(),
      { provider: "zalo", id: "99", name: "Lan", email: null },
    );
    const tokenCall = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect((tokenCall[1].headers as Record<string, string>).secret_key).toBe("zalo-secret");
    const profileCall = fetchImpl.mock.calls[1] as [Request | string, RequestInit?];
    const profileHeaders = (profileCall[1]?.headers ?? {}) as Record<string, string>;
    expect(profileHeaders.appsecret_proof).toBe(zaloAppSecretProof("tok", "zalo-secret"));
    expect(response.cookies.get(SOCIAL_OAUTH_COOKIE)?.value).toBe("");
  });

  it("rejects a Zalo return whose state does not match the cookie", async () => {
    const fetchImpl = vi.fn();
    vi.stubGlobal("fetch", fetchImpl);
    const response = await callback(
      new NextRequest("https://paramuzic.com/api/auth/social/zalo/callback?code=code-1&state=other", {
        headers: { cookie: `${SOCIAL_OAUTH_COOKIE}=${encodeSocialPending(pending)}` },
      }),
      { params: Promise.resolve({ provider: "zalo" }) },
    );
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login/student");
    expect(location.searchParams.get("error")).toBe("provider");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(session.establishSocialSession).not.toHaveBeenCalled();
  });
});
