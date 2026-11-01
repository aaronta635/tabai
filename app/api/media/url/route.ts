import { NextRequest, NextResponse } from "next/server";
import { readTeacherSession, requireTeacher } from "@/lib/auth";
import { allowMediaUrlLookups, mediaIdsFromSearch } from "@/lib/media-url-guard";
import { signedMediaUrl } from "@/lib/media-view";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await readTeacherSession();
  const teacherId = session?.id ?? (await requireTeacher())?.id ?? null;
  if (!teacherId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { ids, overflow } = mediaIdsFromSearch(request.nextUrl.searchParams);
  if (ids.length === 0) {
    return NextResponse.json({ error: "mediaId required" }, { status: 400 });
  }
  if (!allowMediaUrlLookups(teacherId, ids.length)) {
    return NextResponse.json({ error: "slow down" }, { status: 429, headers: { "Retry-After": "15" } });
  }
  if (overflow) {
    return NextResponse.json({ error: "too many" }, { status: 400 });
  }

  const rows = await prisma.media.findMany({
    where: {
      id: { in: ids },
      storagePath: { not: "pending" },
      submissions: { some: { piece: { teacherId } } },
    },
    select: { id: true, storagePath: true },
  });

  const urls: Record<string, string> = {};
  for (const row of rows) {
    const url = await signedMediaUrl(row.storagePath);
    if (url) urls[row.id] = url;
  }

  if (ids.length === 1) {
    const url = urls[ids[0] ?? ""];
    if (!url) {
      const missing = rows.length === 0;
      return NextResponse.json({ error: missing ? "not found" : "sign failed" }, { status: missing ? 404 : 500 });
    }
    return NextResponse.json({ url });
  }

  return NextResponse.json({ urls });
}
