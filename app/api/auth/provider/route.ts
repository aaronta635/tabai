import { NextResponse } from "next/server";
import { API_WAIT_MS } from "@/lib/constants";
import { isOAuthProviderRedirect } from "@/lib/oauth-bind";
import { fetchWithServiceWait } from "@/lib/service-wait";

/** Confirms a Supabase authorize URL will send the browser to Google/Facebook/Zalo. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  const url = body?.url ?? "";
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base || !url.startsWith(`${base}/auth/v1/authorize?`)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const res = await fetchWithServiceWait(url, { redirect: "manual" }, API_WAIT_MS);
  const location = res.headers.get("location");
  if (res.status >= 300 && res.status < 400 && location && isOAuthProviderRedirect(location)) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 400 });
}
