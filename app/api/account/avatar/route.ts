import { extname } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { requireStudentAccount, requireTeacher } from "@/lib/auth";
import { MAX_AVATAR_BYTES } from "@/lib/constants";
import { createSignedUpload } from "@/lib/storage";

function imageFile(filename: string) {
  const ext = extname(filename).toLowerCase();
  if (ext === ".png") return { ext, mime: "image/png" };
  if (ext === ".webp") return { ext, mime: "image/webp" };
  if (ext === ".jpg" || ext === ".jpeg") return { ext: ".jpg", mime: "image/jpeg" };
  return null;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { role?: string; size?: number; filename?: string };
  const file = imageFile(String(body.filename ?? ""));
  if (!file || !body.size) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (body.size > MAX_AVATAR_BYTES) {
    return NextResponse.json({ error: "file too large" }, { status: 400 });
  }

  const teacher = body.role === "teacher" ? await requireTeacher() : null;
  const student = body.role === "student" ? await requireStudentAccount() : null;
  const owner = teacher ? `teachers/${teacher.id}` : student ? `students/${student.id}` : null;
  if (!owner) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const path = `avatars/${owner}/photo${file.ext}`;
  try {
    const signed = await createSignedUpload(path, true);
    return NextResponse.json({
      path: signed.path,
      signedUrl: signed.signedUrl,
      contentType: file.mime,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create upload URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
