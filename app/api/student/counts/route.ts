import { NextResponse } from "next/server";
import { readStudentSession } from "@/lib/auth";
import { studentWaitingCount } from "@/lib/student-stats";

export async function GET() {
  const student = await readStudentSession();
  if (!student) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const waiting = await studentWaitingCount(student.id);
  return NextResponse.json({ waiting });
}
