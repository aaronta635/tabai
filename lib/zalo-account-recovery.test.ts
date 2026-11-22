import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  hasGoogleIdentity,
  isZaloPlaceholderEmail,
  mapZaloRecoveryAuthError,
  needsZaloAccountRecovery,
} from "@/lib/zalo-account-recovery";

function user(partial: Partial<User>): User {
  return {
    id: "auth-1",
    aud: "authenticated",
    email: partial.email ?? "zalo_42@oauth.para.local",
    app_metadata: partial.app_metadata ?? {},
    user_metadata: {},
    created_at: "",
    identities: partial.identities,
    ...partial,
  } as User;
}

describe("isZaloPlaceholderEmail", () => {
  it("matches Zalo placeholder emails only", () => {
    expect(isZaloPlaceholderEmail("zalo_3681046936240438345@oauth.para.local")).toBe(true);
    expect(isZaloPlaceholderEmail("facebook_1@oauth.para.local")).toBe(false);
    expect(isZaloPlaceholderEmail("kid@example.com")).toBe(false);
  });
});

describe("needsZaloAccountRecovery", () => {
  it("is true for a Zalo placeholder without Google", () => {
    expect(needsZaloAccountRecovery(user({ email: "zalo_99@oauth.para.local" }))).toBe(true);
  });

  it("is false when Google is linked", () => {
    expect(
      needsZaloAccountRecovery(
        user({
          email: "zalo_99@oauth.para.local",
          identities: [{ provider: "google", id: "g1", identity_id: "g1", user_id: "auth-1" }],
        }),
      ),
    ).toBe(false);
  });

  it("is false when the user already has a real email", () => {
    expect(needsZaloAccountRecovery(user({ email: "teacher@example.com" }))).toBe(false);
  });
});

describe("hasGoogleIdentity", () => {
  it("reads app_metadata providers", () => {
    expect(hasGoogleIdentity(user({ app_metadata: { providers: ["zalo", "google"] } }))).toBe(true);
  });
});

describe("mapZaloRecoveryAuthError", () => {
  it("maps common Supabase messages", () => {
    expect(mapZaloRecoveryAuthError("User already registered")).toBe("emailTaken");
    expect(mapZaloRecoveryAuthError("Password should be at least 6 characters")).toBe("weakPassword");
    expect(mapZaloRecoveryAuthError("Manual linking is disabled")).toBe("linkingDisabled");
  });
});