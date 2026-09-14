import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/constants";
import { signAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const secret = String(form.get("secret") ?? "");
  const expected = process.env.ADMIN_SECRET;
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  if (!expected || secret !== expected) {
    return NextResponse.redirect(new URL("/admin?error=1", origin));
  }
  const token = await signAdminSession();
  const response = NextResponse.redirect(new URL("/admin", origin));
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
