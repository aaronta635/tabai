import { parseRole, type AccountRole } from "@/lib/onboarding";
import { isLocalhostOrigin, PRODUCTION_APP_ORIGIN, stripOriginSlash } from "@/lib/app-origin";

export const OAUTH_BIND_COOKIE = "howl0_oauth_bind";

/**
 * Google returns to the origin that started sign-in.
 * A deployed process still refuses a localhost callback, which Supabase would replace
 * with the Site URL.
 */
export function oauthCallbackUrl(pageOrigin: string) {
  const origin = stripOriginSlash(pageOrigin);
  const deployed = Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";
  if (origin && !(isLocalhostOrigin(origin) && deployed)) return `${origin}/auth/callback`;
  return `${PRODUCTION_APP_ORIGIN}/auth/callback`;
}

export function oauthRedirectTo(pageOrigin: string, role: AccountRole, next: string) {
  const url = new URL(oauthCallbackUrl(pageOrigin));
  url.searchParams.set("role", role);
  if (next) url.searchParams.set("next", next);
  return url.toString();
}

export function isOAuthProviderRedirect(location: string) {
  try {
    const host = new URL(location).hostname.toLowerCase();
    return (
      host === "accounts.google.com" ||
      host.endsWith(".google.com") ||
      host === "www.facebook.com" ||
      host === "facebook.com" ||
      host.endsWith(".facebook.com") ||
      host.includes("zalo")
    );
  } catch {
    return false;
  }
}

export type OAuthBind = { role: AccountRole; next: string };

export function encodeOAuthBind(role: AccountRole, next: string) {
  return encodeURIComponent(JSON.stringify({ role, next }));
}

export function parseOAuthBind(raw: string | null | undefined): OAuthBind | null {
  if (!raw) return null;
  try {
    const text = raw.startsWith("{") ? raw : decodeURIComponent(raw);
    const value = JSON.parse(text) as { role?: string; next?: string };
    const role = parseRole(value.role);
    if (!role) return null;
    return { role, next: typeof value.next === "string" ? value.next : "" };
  } catch {
    return null;
  }
}
