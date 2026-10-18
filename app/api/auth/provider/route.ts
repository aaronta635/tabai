import { NextResponse } from "next/server";

/** Confirms a Supabase authorize URL will redirect before the browser leaves the page. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  const url = body?.url ?? "";
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base || !url.startsWith(`${base}/auth/v1/authorize?`)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const res = await fetch(url, { redirect: "manual" });
  const location = res.headers.get("location");
  if (res.status >= 300 && res.status < 400 && location) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 400 });
}
