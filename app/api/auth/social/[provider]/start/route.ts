import { NextRequest, NextResponse } from "next/server";
import { originFromRequest } from "@/lib/app-origin";
import { parseRole } from "@/lib/onboarding";
import { authPath, safeReturn } from "@/lib/return-path";
import {
  SOCIAL_OAUTH_COOKIE,
  encodeSocialPending,
  facebookDialogUrl,
  parseSocialProvider,
  randomOAuthState,
  socialCallbackPath,
  zaloCodeChallenge,
  zaloCodeVerifier,
  zaloPermissionUrl,
  type SocialFrom,
} from "@/lib/social-oauth";

function cookieOptions(request: NextRequest) {
  return {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const provider = parseSocialProvider((await context.params).provider);
  const role = parseRole(request.nextUrl.searchParams.get("role"));
  const origin = originFromRequest(request);
  const from: SocialFrom = request.nextUrl.searchParams.get("from") === "signup" ? "signup" : "login";
  if (!provider || !role) {
    return NextResponse.redirect(new URL("/login?error=provider", origin));
  }

  const next = safeReturn(role, request.nextUrl.searchParams.get("next")) ?? "";
  const appId = provider === "zalo" ? process.env.ZALO_APP_ID?.trim() : process.env.FACEBOOK_APP_ID?.trim();
  const back = new URL(authPath(from, role, next), origin);
  back.searchParams.set("error", "provider");
  if (!appId) return NextResponse.redirect(back);

  const state = randomOAuthState();
  const verifier = provider === "zalo" ? zaloCodeVerifier() : null;
  const redirectUri = `${origin}${socialCallbackPath(provider)}`;
  const location =
    provider === "zalo"
      ? zaloPermissionUrl({
          appId,
          redirectUri,
          state,
          codeChallenge: zaloCodeChallenge(verifier!),
        })
      : facebookDialogUrl({ appId, redirectUri, state });

  const response = NextResponse.redirect(location);
  response.cookies.set(
    SOCIAL_OAUTH_COOKIE,
    encodeSocialPending({ provider, state, verifier, role, next, from }),
    cookieOptions(request),
  );
  return response;
}
