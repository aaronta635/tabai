import { extname } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { sheetKindFromName, tutorialKindFromName } from "@/lib/catalog";
import { MAX_SHEET_BYTES, MAX_VIDEO_BYTES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { createSignedUpload } from "@/lib/storage";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const teacher = await requireTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const piece = await prisma.piece.findFirst({
    where: { id, teacherId: teacher.id, archived: false },
  });
  if (!piece) {
    return NextResponse.json({ error: "piece not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    kind?: string;
    size?: number;
    filename?: string;
    contentType?: string;
  };
  const filename = String(body.filename ?? "").trim();
  if (!body.size || !filename) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const kind = body.kind === "sheet" ? "sheet" : body.kind === "tutorial" ? "tutorial" : null;
  if (!kind) {
    return NextResponse.json({ error: "kind required" }, { status: 400 });
  }

  const sniffed =
    kind === "sheet" ? sheetKindFromName(filename) : tutorialKindFromName(filename);
  if (!sniffed) {
    return NextResponse.json({ error: "unsupported file" }, { status: 400 });
  }

  const max = kind === "sheet" ? MAX_SHEET_BYTES : MAX_VIDEO_BYTES;
  if (body.size > max) {
    return NextResponse.json({ error: "file too large" }, { status: 400 });
  }

  const media = await prisma.media.create({
    data: {
      kind: sniffed.kind,
      storagePath: "pending",
      sizeBytes: body.size,
    },
  });

  const ext = extname(filename).toLowerCase();
  const path = `teachers/${piece.teacherId}/pieces/${piece.id}/${kind}/${media.id}${ext}`;
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
      contentType: sniffed.mime,
    });
  } catch (error) {
    await prisma.media.delete({ where: { id: media.id } }).catch(() => undefined);
    const message = error instanceof Error ? error.message : "Could not create upload URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
