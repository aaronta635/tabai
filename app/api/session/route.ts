import { NextRequest, NextResponse } from "next/server";
import { bindAuthSession, isRoleMismatch, signOutAccount, type BindAuthResult } from "@/lib/auth";
import { parseRole } from "@/lib/onboarding";
import { originFromRequest } from "@/lib/app-origin";
import { destinationAfterAuth, safeReturn, signInPath } from "@/lib/return-path";

function safePath(value: string | null) {
  return value?.startsWith("/") ? value : null;
}

function afterBind(bound: Exclude<BindAuthResult, { error: string }>, requested: string | null) {
  return destinationAfterAuth({
    role: bound.role,
    onboarded: bound.onboarded,
    requested,
    home: bound.next,
  });
}

export async function GET(request: NextRequest) {
  const requested = safePath(request.nextUrl.searchParams.get("next"));
  const role = parseRole(request.nextUrl.searchParams.get("role"));
  const origin = originFromRequest(request);
  const bound = await bindAuthSession(role, requested);
  if (!bound || isRoleMismatch(bound)) {
    const auth = new URL(role ? signInPath(role, requested) : "/login", origin);
    if (bound) auth.searchParams.set("error", "role_mismatch");
    return NextResponse.redirect(auth);
  }
  return NextResponse.redirect(new URL(afterBind(bound, requested), origin));
}

export async function POST(request: NextRequest) {
  let role = parseRole(request.nextUrl.searchParams.get("role"));
  let next = safePath(request.nextUrl.searchParams.get("next"));
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const body = (await request.json()) as { role?: string; next?: string };
      role = parseRole(body.role) ?? role;
      if (typeof body.next === "string") next = safePath(body.next);
    } catch {
      // empty or invalid JSON
    }
  }
  const carried = role ? safeReturn(role, next) : null;
  const bound = await bindAuthSession(role, carried);
  if (!bound) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (isRoleMismatch(bound)) {
    await signOutAccount();
    return NextResponse.json({ error: bound.error, actual: bound.actual }, { status: 409 });
  }
  return NextResponse.json({
    ok: true,
    role: bound.role,
    onboarded: bound.onboarded,
    next: afterBind(bound, carried),
  });
}
