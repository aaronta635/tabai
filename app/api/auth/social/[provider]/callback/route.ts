import { NextRequest, NextResponse } from "next/server";
import { originFromRequest } from "@/lib/app-origin";
import { authPath } from "@/lib/return-path";
import { establishSocialSession } from "@/lib/social-session";
import {
  SOCIAL_OAUTH_COOKIE,
  exchangeFacebookCode,
  exchangeZaloCode,
  fetchFacebookProfile,
  fetchZaloProfile,
  parseSocialPending,
  parseSocialProvider,
  socialCallbackPath,
  type SocialProfile,
} from "@/lib/social-oauth";

function fail(origin: string, pending: ReturnType<typeof parseSocialPending>, request: NextRequest) {
  const path = pending ? authPath(pending.from, pending.role, pending.next) : "/login";
  const url = new URL(path, origin);
  url.searchParams.set("error", "provider");
  const response = NextResponse.redirect(url);
  response.cookies.set(SOCIAL_OAUTH_COOKIE, "", {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const provider = parseSocialProvider((await context.params).provider);
  const origin = originFromRequest(request);
  const pending = parseSocialPending(request.cookies.get(SOCIAL_OAUTH_COOKIE)?.value);
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!provider || !pending || pending.provider !== provider || !code || !state || state !== pending.state) {
    return fail(origin, pending, request);
  }

  const redirectUri = `${origin}${socialCallbackPath(provider)}`;
  try {
    let profile: SocialProfile;
    if (provider === "zalo") {
      const appId = process.env.ZALO_APP_ID?.trim() ?? "";
      const appSecret = process.env.ZALO_APP_SECRET?.trim() ?? "";
      if (!appId || !appSecret || !pending.verifier) throw new Error("zalo env");
      const accessToken = await exchangeZaloCode({
        appId,
        appSecret,
        code,
        verifier: pending.verifier,
      });
      const zalo = await fetchZaloProfile({ accessToken, appSecret });
      profile = { provider, ...zalo };
    } else {
      const appId = process.env.FACEBOOK_APP_ID?.trim() ?? "";
      const appSecret = process.env.FACEBOOK_APP_SECRET?.trim() ?? "";
      if (!appId || !appSecret) throw new Error("facebook env");
      const accessToken = await exchangeFacebookCode({
        appId,
        appSecret,
        redirectUri,
        code,
      });
      const facebook = await fetchFacebookProfile({ accessToken });
      profile = { provider, ...facebook };
    }

    const dest = new URL("/auth/callback", origin);
    dest.searchParams.set("role", pending.role);
    if (pending.next) dest.searchParams.set("next", pending.next);
    const response = NextResponse.redirect(dest);
    await establishSocialSession(response, profile);
    response.cookies.set(SOCIAL_OAUTH_COOKIE, "", {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch {
    return fail(origin, pending, request);
  }
}
