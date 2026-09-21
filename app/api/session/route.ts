import { NextRequest, NextResponse } from "next/server";
import { bindAuthSession, isRoleMismatch, signOutAccount, type BindAuthResult } from "@/lib/auth";
import { parseRole, type AccountRole } from "@/lib/onboarding";

function safePath(value: string | null) {
  return value?.startsWith("/") ? value : null;
}

async function bindForRequest(role: AccountRole | null): Promise<BindAuthResult | null> {
  const bound = await bindAuthSession(role);
  if (isRoleMismatch(bound)) {
    return bindAuthSession(bound.actual);
  }
  return bound;
}

export async function GET(request: NextRequest) {
  const requested = safePath(request.nextUrl.searchParams.get("next"));
  const role = parseRole(request.nextUrl.searchParams.get("role"));
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const bound = await bindForRequest(role);
  if (!bound || isRoleMismatch(bound)) {
    const auth = new URL("/auth", origin);
    if (requested) auth.searchParams.set("next", requested);
    if (role) auth.searchParams.set("role", role);
    return NextResponse.redirect(auth);
  }
  const dest = bound.role === "student" || !bound.onboarded ? bound.next : (requested ?? bound.next);
  return NextResponse.redirect(new URL(dest, origin));
}

export async function POST(request: NextRequest) {
  let role = parseRole(request.nextUrl.searchParams.get("role"));
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const body = (await request.json()) as { role?: string };
      role = parseRole(body.role) ?? role;
    } catch {
      // empty or invalid JSON
    }
  }
  const bound = await bindAuthSession(role);
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
    next: bound.next,
  });
}
