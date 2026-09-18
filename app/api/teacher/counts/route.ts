import { NextResponse } from "next/server";
import { readTeacherSession } from "@/lib/auth";
import { teacherNavCounts } from "@/lib/teacher-stats";

export async function GET() {
  const teacher = await readTeacherSession();
  if (!teacher) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const counts = await teacherNavCounts(teacher.id);
  return NextResponse.json(counts);
}
