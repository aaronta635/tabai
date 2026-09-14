import { NextRequest, NextResponse } from "next/server";
import { MAX_VIDEO_BYTES } from "@/lib/constants";
import { getStudentTokenFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSignedUpload } from "@/lib/storage";

export async function POST(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const piece = await prisma.piece.findUnique({ where: { code } });
  if (!piece || piece.archived) {
    return NextResponse.json({ error: "piece not found" }, { status: 404 });
  }

  const token = await getStudentTokenFromCookie();
  if (!token) {
    return NextResponse.json({ error: "register first" }, { status: 401 });
  }
  const student = await prisma.student.findFirst({
    where: { token, teacherId: piece.teacherId },
  });
  if (!student) {
    return NextResponse.json({ error: "register first" }, { status: 401 });
  }

  const body = (await request.json()) as { size?: number; contentType?: string };
  if (!body.size || body.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: "file too large" }, { status: 400 });
  }

  const media = await prisma.media.create({
    data: {
      kind: "video",
      storagePath: "pending",
      sizeBytes: body.size,
    },
  });

  const path = `teachers/${piece.teacherId}/pieces/${piece.id}/students/${student.id}/${media.id}`;
  const signed = await createSignedUpload(path);
  await prisma.media.update({
    where: { id: media.id },
    data: { storagePath: signed.path },
  });

  return NextResponse.json({
    mediaId: media.id,
    path: signed.path,
    signedUrl: signed.signedUrl,
    token: signed.token,
  });
}
