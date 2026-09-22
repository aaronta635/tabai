import { NextResponse } from "next/server";
import { readStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const student = await readStudentSession();
  if (!student) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const waiting = await prisma.submission.count({
    where: { studentId: student.id, kind: { in: ["take", "overdub"] }, status: { in: ["new", "drafted"] } },
  });
  return NextResponse.json({ waiting });
}
