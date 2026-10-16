import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signedMediaUrl } from "@/lib/media-view";

export async function GET(request: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const mediaId = request.nextUrl.searchParams.get("mediaId");
  if (!mediaId) {
    return NextResponse.json({ error: "mediaId required" }, { status: 400 });
  }

  const media = await prisma.media.findFirst({
    where: {
      id: mediaId,
      submissions: { some: { piece: { teacherId: teacher.id } } },
    },
  });
  if (!media || media.storagePath === "pending") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const url = await signedMediaUrl(media.storagePath);
  if (!url) {
    return NextResponse.json({ error: "sign failed" }, { status: 500 });
  }
  return NextResponse.json({ url });
}
