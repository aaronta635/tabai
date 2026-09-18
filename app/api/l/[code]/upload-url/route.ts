import { NextRequest, NextResponse } from "next/server";
import { MAX_VIDEO_BYTES } from "@/lib/constants";
import { studentForPiece } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSignedUpload } from "@/lib/storage";

export async function POST(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const piece = await prisma.piece.findUnique({ where: { code } });
  if (!piece || piece.archived) {
    return NextResponse.json({ error: "piece not found" }, { status: 404 });
  }

  const bound = await studentForPiece(piece.teacherId);
  if (bound.otherClass) {
    return NextResponse.json({ error: "other class" }, { status: 409 });
  }
  let student = bound.student;
  if (!student) {
    return NextResponse.json({ error: "register first" }, { status: 401 });
  }
  if (!student.teacherId) {
    student = await prisma.student.update({
      where: { id: student.id },
      data: { teacherId: piece.teacherId, stage: "in_class" },
    });
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
  try {
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
  } catch (error) {
    await prisma.media.delete({ where: { id: media.id } }).catch(() => undefined);
    const message = error instanceof Error ? error.message : "Could not create upload URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
