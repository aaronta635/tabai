import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { weekRangeUtc } from "@/lib/schedule";
import { createSignedReadUrl } from "@/lib/storage";

const HIGHLIGHT_URL_SECONDS = 10 * 60;

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length > 64) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { start, end } = weekRangeUtc(new Date());
  const reply = await prisma.reply.findFirst({
    where: {
      sentAt: { gte: start, lt: end },
      highlightStartS: { not: null },
      submission: { student: { reportToken: token, name: { not: "anonymised" } } },
    },
    orderBy: { sentAt: "desc" },
    select: {
      highlightStartS: true,
      submission: { select: { media: { select: { storagePath: true } } } },
    },
  });
  const path = reply?.submission.media.storagePath;
  if (reply?.highlightStartS == null || !path || path === "pending") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const url = await createSignedReadUrl(path, HIGHLIGHT_URL_SECONDS);
    return NextResponse.json({ url, start: reply.highlightStartS });
  } catch {
    return NextResponse.json({ error: "sign failed" }, { status: 500 });
  }
}
