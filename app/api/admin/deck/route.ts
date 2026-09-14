import { requireAdmin } from "@/lib/auth";
import { deckExport } from "@/lib/metrics-data";
import { NextResponse } from "next/server";

export async function GET() {
  const ok = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const data = await deckExport();
  return NextResponse.json(data);
}
