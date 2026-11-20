import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readStudentSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { loadPieceClassroom } from "@/lib/piece-view";
import { prisma } from "@/lib/prisma";
import { studentPitchCopy, toStudentPitchClip } from "@/lib/student-pitch";
import { PracticeSession } from "@/components/student/practice-session";

export const dynamic = "force-dynamic";

export default async function StudentPracticePage({ params }: { params: Promise<{ code: string }> }) {
  const student = await readStudentSession();
  if (!student) redirect(signInPath("student", "/student"));
  const { code } = await params;
  const room = await loadPieceClassroom(code);
  if (!room.canSubmit || room.needsProfile) redirect(`/student/work/${code}`);
  const locale = await getLocale();
  const t = await getMessages(locale);
  const copy = studentPitchCopy(t.student);
  const rows = await prisma.submission.findMany({
    where: { studentId: student.id, pieceId: room.piece.id, kind: { in: ["practice", "take"] } },
    orderBy: { submittedAt: "desc" },
    take: 20,
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
  const clips = rows.map((row) =>
    toStudentPitchClip({
      id: row.id,
      kind: row.kind,
      submittedAt: row.submittedAt,
      metricsJson: row.analyses[0]?.metricsJson ?? null,
      observationsJson: row.analyses[0]?.observationsJson ?? null,
      job: row.jobs[0] ?? null,
      copy,
    }),
  );

  return (
    <PracticeSession
      code={code}
      title={room.piece.title}
      tutorialUrl={room.tutorialUrl}
      clipUrl={room.clipUrl}
      sheetUrl={room.sheetUrl}
      sheetKind={room.sheetKind}
      sheetSync={room.sheetSync}
      clips={clips}
    />
  );
}
