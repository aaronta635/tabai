import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSignedReadUrl } from "@/lib/storage";

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

  try {
    const url = await createSignedReadUrl(media.storagePath);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "sign failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
