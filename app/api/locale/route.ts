import { NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { locale?: string };
  const locale = body.locale === "en" ? "en" : "vi";
  const response = NextResponse.json({ ok: true });
  response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return response;
}
