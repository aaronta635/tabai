import { NextRequest, NextResponse } from "next/server";
import { bindAuthSession, isRoleMismatch, signOutAccount } from "@/lib/auth";
import { parseRole } from "@/lib/onboarding";
import { destinationAfterAuth, safeReturn, signInPath } from "@/lib/return-path";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");
  const role = parseRole(request.nextUrl.searchParams.get("role"));
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const carried = role ? safeReturn(role, next) : null;

  if (code) {
    const supabase = await createServerSupabase();
    await supabase.auth.exchangeCodeForSession(code);
  }
  const bound = await bindAuthSession(role, carried);
  if (isRoleMismatch(bound)) {
    await signOutAccount();
    const auth = new URL(role ? signInPath(role, carried) : "/login", origin);
    auth.searchParams.set("error", "role_mismatch");
    return NextResponse.redirect(auth);
  }
  if (!bound) {
    return NextResponse.redirect(new URL(role ? signInPath(role, carried) : "/login", origin));
  }
  const dest = destinationAfterAuth({
    role: bound.role,
    onboarded: bound.onboarded,
    requested: carried,
    home: bound.next,
  });
  return NextResponse.redirect(new URL(dest, origin));
}
