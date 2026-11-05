import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { teacherSubmission } from "@/lib/scope";

export async function GET(request: NextRequest) {
  const submissionId = request.nextUrl.searchParams.get("submissionId");
  if (!submissionId) {
    return NextResponse.json({ error: "submissionId required" }, { status: 400 });
  }

  const teacher = await requireTeacher();
  const owned = teacher ? await teacherSubmission(teacher.id, submissionId) : null;
  if (!owned) {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const demo = await prisma.submission.findFirst({
      where: { id: submissionId, piece: { demo: true } },
      select: { id: true },
    });
    if (!demo) return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const draft = await prisma.draft.findFirst({
    where: { submissionId },
    orderBy: { createdAt: "desc" },
    select: { text: true, createdAt: true },
  });
  return NextResponse.json({
    text: draft?.text ?? null,
    createdAt: draft?.createdAt.toISOString() ?? null,
  });
}
