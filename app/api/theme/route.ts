import { NextRequest, NextResponse } from "next/server";
import { THEME_COOKIE } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { theme?: string };
  const theme = body.theme === "dark" ? "dark" : "light";
  const response = NextResponse.json({ ok: true, theme });
  response.cookies.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  });
  return response;
}
