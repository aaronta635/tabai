import { NextResponse } from "next/server";
import { readStudentSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { studentPitchCopy, toStudentPitchClip } from "@/lib/student-pitch";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const student = await readStudentSession();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const locale = await getLocale();
  const t = await getMessages(locale);
  const row = await prisma.submission.findFirst({
    where: { id, studentId: student.id },
    select: {
      id: true,
      kind: true,
      submittedAt: true,
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { metricsJson: true, observationsJson: true },
      },
      jobs: {
        where: { type: "analyze" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, attempts: true, lastError: true, updatedAt: true },
      },
    },
  });
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(
    toStudentPitchClip({
      id: row.id,
      kind: row.kind,
      submittedAt: row.submittedAt,
      metricsJson: row.analyses[0]?.metricsJson ?? null,
      observationsJson: row.analyses[0]?.observationsJson ?? null,
      job: row.jobs[0] ?? null,
      copy: studentPitchCopy(t.student),
    }),
  );
}
