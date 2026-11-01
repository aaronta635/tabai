import { afterEach, describe, expect, it, vi } from "vitest";
import {
  encodeOAuthBind,
  isOAuthProviderRedirect,
  oauthCallbackUrl,
  oauthRedirectTo,
  parseOAuthBind,
} from "@/lib/oauth-bind";

describe("oauthCallbackUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns to the site that started sign-in, including localhost", () => {
    expect(oauthCallbackUrl("https://paramuzic.com")).toBe("https://paramuzic.com/auth/callback");
    expect(oauthCallbackUrl("https://paramuzic.com/")).toBe("https://paramuzic.com/auth/callback");
    expect(oauthCallbackUrl("http://localhost:3000")).toBe("http://localhost:3000/auth/callback");
  });

  it("keeps role and next on a local callback", () => {
    expect(oauthRedirectTo("http://localhost:3000", "student", "/student")).toBe(
      "http://localhost:3000/auth/callback?role=student&next=%2Fstudent",
    );
  });

  it("refuses a localhost callback once the process is deployed", () => {
    vi.stubEnv("VERCEL", "1");
    expect(oauthCallbackUrl("http://localhost:3000")).toBe("https://paramuzic.com/auth/callback");
  });

  it("accepts Google and rejects a bounce to the app site", () => {
    expect(isOAuthProviderRedirect("https://accounts.google.com/o/oauth2/v2/auth")).toBe(true);
    expect(isOAuthProviderRedirect("https://paramuzic.com/")).toBe(false);
    expect(isOAuthProviderRedirect("https://paramuzic.com/auth/callback")).toBe(false);
  });
});

describe("oauth bind cookie", () => {
  it("round-trips role and next", () => {
    expect(parseOAuthBind(encodeOAuthBind("student", "/student/work"))).toEqual({
      role: "student",
      next: "/student/work",
    });
  });

  it("reads JSON that the cookie decoder already unescaped", () => {
    expect(parseOAuthBind(JSON.stringify({ role: "tutor", next: "/teacher" }))).toEqual({
      role: "tutor",
      next: "/teacher",
    });
  });

  it("drops junk", () => {
    expect(parseOAuthBind("not-json")).toBeNull();
    expect(parseOAuthBind(JSON.stringify({ role: "admin", next: "/student" }))).toBeNull();
  });
});
