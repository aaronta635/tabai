import { NextRequest, NextResponse } from "next/server";
import { bindAuthSession, isRoleMismatch, signOutAccount } from "@/lib/auth";
import { parseRole } from "@/lib/onboarding";
import { originFromRequest } from "@/lib/app-origin";
import { OAUTH_BIND_COOKIE, parseOAuthBind } from "@/lib/oauth-bind";
import { destinationAfterAuth, safeReturn, signInPath } from "@/lib/return-path";
import { createServerSupabase } from "@/lib/supabase/server";

function redirectHome(url: URL) {
  const response = NextResponse.redirect(url);
  response.cookies.delete(OAUTH_BIND_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const bind = parseOAuthBind(request.cookies.get(OAUTH_BIND_COOKIE)?.value);
  const role = parseRole(request.nextUrl.searchParams.get("role")) ?? bind?.role ?? null;
  const next = request.nextUrl.searchParams.get("next") ?? bind?.next ?? null;
  const origin = originFromRequest(request);
  const carried = role ? safeReturn(role, next) : null;

  if (code) {
    const supabase = await createServerSupabase();
    await supabase.auth.exchangeCodeForSession(code);
  }
  const bound = await bindAuthSession(role, carried);
  if (isRoleMismatch(bound)) {
    if (code) await signOutAccount();
    const auth = new URL(role ? signInPath(role, carried) : "/login", origin);
    auth.searchParams.set("error", "role_mismatch");
    return redirectHome(auth);
  }
  if (!bound) {
    return redirectHome(new URL(role ? signInPath(role, carried) : "/login", origin));
  }
  const dest = destinationAfterAuth({
    role: bound.role,
    onboarded: bound.onboarded,
    requested: carried,
    home: bound.next,
  });
  return redirectHome(new URL(dest, origin));
}
