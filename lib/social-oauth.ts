import { createHash, createHmac, randomBytes } from "node:crypto";
import type { AccountRole } from "@/lib/onboarding";
import { parseRole } from "@/lib/onboarding";

export const SOCIAL_OAUTH_COOKIE = "para_social_oauth";

const VERIFIER_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export type SocialProvider = "facebook" | "zalo";
export type SocialFrom = "login" | "signup";

export type SocialPending = {
  provider: SocialProvider;
  state: string;
  verifier: string | null;
  role: AccountRole;
  next: string;
  from: SocialFrom;
};

export type SocialProfile = {
  provider: SocialProvider;
  id: string;
  name: string;
  email: string | null;
};

export function parseSocialProvider(value: string | null | undefined): SocialProvider | null {
  if (value === "facebook" || value === "zalo") return value;
  return null;
}

/** PKCE S256. Zalo v4 requires a fresh 43-character verifier on every login. */
export function zaloCodeVerifier() {
  const bytes = randomBytes(43);
  const chars = Array.from(bytes, (byte) => VERIFIER_ALPHABET[byte % VERIFIER_ALPHABET.length]!);
  if (!/[A-Z]/.test(chars.join(""))) chars[0] = "A";
  if (!/[a-z]/.test(chars.join(""))) chars[1] = "a";
  if (!/[0-9]/.test(chars.join(""))) chars[2] = "7";
  return chars.join("");
}

/** RFC 7636: BASE64URL(SHA256(ASCII(verifier))) without padding. */
export function zaloCodeChallenge(verifier: string) {
  return createHash("sha256").update(verifier, "ascii").digest("base64url");
}

export function randomOAuthState() {
  return randomBytes(32).toString("base64url");
}

export function zaloPermissionUrl(input: {
  appId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}) {
  const url = new URL("https://oauth.zaloapp.com/v4/permission");
  url.searchParams.set("app_id", input.appId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("state", input.state);
  return url.toString();
}

export function facebookDialogUrl(input: {
  appId: string;
  redirectUri: string;
  state: string;
}) {
  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", input.appId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("state", input.state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "email,public_profile");
  return url.toString();
}

export function socialCallbackPath(provider: SocialProvider) {
  return `/api/auth/social/${provider}/callback`;
}

export function encodeSocialPending(pending: SocialPending) {
  return encodeURIComponent(JSON.stringify(pending));
}

export function parseSocialPending(raw: string | null | undefined): SocialPending | null {
  if (!raw) return null;
  try {
    const text = raw.startsWith("{") ? raw : decodeURIComponent(raw);
    const value = JSON.parse(text) as Partial<SocialPending>;
    const provider = parseSocialProvider(value.provider);
    const role = parseRole(value.role);
    if (!provider || !role || typeof value.state !== "string" || !value.state) return null;
    const from: SocialFrom = value.from === "signup" ? "signup" : "login";
    return {
      provider,
      state: value.state,
      verifier: typeof value.verifier === "string" ? value.verifier : null,
      role,
      next: typeof value.next === "string" ? value.next : "",
      from,
    };
  } catch {
    return null;
  }
}

export function socialAccountEmail(provider: SocialProvider, id: string, email?: string | null) {
  const subject = id.replace(/[^A-Za-z0-9]/g, "");
  if (!subject) throw new Error("missing subject");
  const trimmed = email?.trim().toLowerCase() ?? "";
  if (provider === "facebook" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return trimmed;
  return `${provider}_${subject}@oauth.para.local`;
}

export function zaloAppSecretProof(accessToken: string, appSecret: string) {
  return createHmac("sha256", appSecret).update(accessToken).digest("hex");
}

export async function exchangeZaloCode(input: {
  appId: string;
  appSecret: string;
  code: string;
  verifier: string;
  fetchImpl?: typeof fetch;
}) {
  const body = new URLSearchParams({
    code: input.code,
    app_id: input.appId,
    grant_type: "authorization_code",
    code_verifier: input.verifier,
  });
  const response = await (input.fetchImpl ?? fetch)("https://oauth.zaloapp.com/v4/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      secret_key: input.appSecret,
    },
    body,
  });
  const json = (await response.json().catch(() => null)) as {
    access_token?: string;
    error?: number;
  } | null;
  if (!response.ok || !json?.access_token || (typeof json.error === "number" && json.error !== 0)) {
    throw new Error("zalo token");
  }
  return json.access_token;
}

export async function fetchZaloProfile(input: {
  accessToken: string;
  appSecret: string;
  fetchImpl?: typeof fetch;
}): Promise<Omit<SocialProfile, "provider">> {
  const url = new URL("https://graph.zalo.me/v2.0/me");
  url.searchParams.set("fields", "id,name,picture");
  const response = await (input.fetchImpl ?? fetch)(url, {
    headers: {
      access_token: input.accessToken,
      appsecret_proof: zaloAppSecretProof(input.accessToken, input.appSecret),
    },
  });
  const json = (await response.json().catch(() => null)) as {
    error?: number;
    id?: string;
    name?: string;
  } | null;
  const id = json?.id?.trim() ?? "";
  if (!response.ok || !json || json.error !== 0 || !id) throw new Error("zalo profile");
  return { id, name: json.name?.trim() || "Zalo", email: null };
}

export async function exchangeFacebookCode(input: {
  appId: string;
  appSecret: string;
  redirectUri: string;
  code: string;
  fetchImpl?: typeof fetch;
}) {
  const url = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  url.searchParams.set("client_id", input.appId);
  url.searchParams.set("client_secret", input.appSecret);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("code", input.code);
  const response = await (input.fetchImpl ?? fetch)(url);
  const json = (await response.json().catch(() => null)) as { access_token?: string } | null;
  if (!response.ok || !json?.access_token) throw new Error("facebook token");
  return json.access_token;
}

export async function fetchFacebookProfile(input: {
  accessToken: string;
  fetchImpl?: typeof fetch;
}): Promise<Omit<SocialProfile, "provider">> {
  const url = new URL("https://graph.facebook.com/v21.0/me");
  url.searchParams.set("fields", "id,name,email");
  url.searchParams.set("access_token", input.accessToken);
  const response = await (input.fetchImpl ?? fetch)(url);
  const json = (await response.json().catch(() => null)) as {
    id?: string;
    name?: string;
    email?: string;
  } | null;
  const id = json?.id?.trim() ?? "";
  if (!response.ok || !id) throw new Error("facebook profile");
  return { id, name: json?.name?.trim() || "Facebook", email: json?.email?.trim() || null };
}
