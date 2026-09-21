import { NextRequest, NextResponse } from "next/server";
import { bindAuthSession, isRoleMismatch, signOutAccount } from "@/lib/auth";
import { parseRole } from "@/lib/onboarding";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");
  const role = parseRole(request.nextUrl.searchParams.get("role"));
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  if (code) {
    const supabase = await createServerSupabase();
    await supabase.auth.exchangeCodeForSession(code);
  }
  const bound = await bindAuthSession(role);
  if (isRoleMismatch(bound)) {
    await signOutAccount();
    const auth = new URL("/auth", origin);
    if (role) auth.searchParams.set("role", role);
    auth.searchParams.set("error", "role_mismatch");
    return NextResponse.redirect(auth);
  }
  const dest = bound?.next ?? (next?.startsWith("/") ? next : "/auth");
  return NextResponse.redirect(new URL(dest, origin));
}
