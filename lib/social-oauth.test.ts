import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  encodeSocialPending,
  exchangeZaloCode,
  facebookDialogUrl,
  fetchZaloProfile,
  parseSocialPending,
  socialAccountEmail,
  zaloAppSecretProof,
  zaloCodeChallenge,
  zaloCodeVerifier,
  zaloPermissionUrl,
} from "@/lib/social-oauth";

describe("Zalo PKCE", () => {
  it("matches the PKCE S256 example", () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    expect(zaloCodeChallenge(verifier)).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
    expect(zaloCodeChallenge(verifier)).toBe(
      createHash("sha256").update(verifier, "ascii").digest("base64url"),
    );
  });

  it("issues a 43-character verifier with upper, lower, and digits", () => {
    const verifier = zaloCodeVerifier();
    expect(verifier).toHaveLength(43);
    expect(verifier).toMatch(/[A-Z]/);
    expect(verifier).toMatch(/[a-z]/);
    expect(verifier).toMatch(/[0-9]/);
  });
});

describe("provider URLs", () => {
  it("sends Zalo the app id, callback, challenge, and state", () => {
    const url = new URL(
      zaloPermissionUrl({
        appId: "123",
        redirectUri: "https://paramuzic.com/api/auth/social/zalo/callback",
        state: "state-1",
        codeChallenge: "challenge",
      }),
    );
    expect(url.origin + url.pathname).toBe("https://oauth.zaloapp.com/v4/permission");
    expect(url.searchParams.get("app_id")).toBe("123");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://paramuzic.com/api/auth/social/zalo/callback",
    );
    expect(url.searchParams.get("code_challenge")).toBe("challenge");
    expect(url.searchParams.get("state")).toBe("state-1");
  });

  it("asks Facebook for email and the public profile", () => {
    const url = new URL(
      facebookDialogUrl({
        appId: "fb-app",
        redirectUri: "https://paramuzic.com/api/auth/social/facebook/callback",
        state: "state-2",
      }),
    );
    expect(url.pathname).toBe("/v21.0/dialog/oauth");
    expect(url.searchParams.get("client_id")).toBe("fb-app");
    expect(url.searchParams.get("scope")).toBe("email,public_profile");
    expect(url.searchParams.get("response_type")).toBe("code");
  });
});

describe("social account email", () => {
  it("keeps a Facebook email and invents one for Zalo", () => {
    expect(socialAccountEmail("facebook", "42", "Lan@Studio.test")).toBe("lan@studio.test");
    expect(socialAccountEmail("zalo", "3681046936240438345", null)).toBe(
      "zalo_3681046936240438345@oauth.para.local",
    );
  });
});

describe("social pending cookie", () => {
  it("round-trips the role chosen on the sign-in page", () => {
    const pending = {
      provider: "zalo" as const,
      state: "abc",
      verifier: "verifier",
      role: "student" as const,
      next: "/student",
      from: "login" as const,
    };
    expect(parseSocialPending(encodeSocialPending(pending))).toEqual(pending);
  });
});

describe("Zalo token exchange", () => {
  it("posts the verifier and sends the app secret as a header", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ access_token: "tok", error: 0 }),
    })) as unknown as typeof fetch;

    await expect(
      exchangeZaloCode({
        appId: "123",
        appSecret: "secret",
        code: "code",
        verifier: "verifier",
        fetchImpl,
      }),
    ).resolves.toBe("tok");

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://oauth.zaloapp.com/v4/access_token");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).secret_key).toBe("secret");
    expect(String(init.body)).toContain("code_verifier=verifier");
    expect(String(init.body)).toContain("grant_type=authorization_code");
  });

  it("proves the access token when reading the profile", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ error: 0, id: "99", name: "Lan" }),
    })) as unknown as typeof fetch;

    await expect(
      fetchZaloProfile({ accessToken: "tok", appSecret: "secret", fetchImpl }),
    ).resolves.toEqual({ id: "99", name: "Lan", email: null });

    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.access_token).toBe("tok");
    expect(headers.appsecret_proof).toBe(zaloAppSecretProof("tok", "secret"));
  });
});
