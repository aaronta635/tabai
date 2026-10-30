import { notFound, redirect } from "next/navigation";
import { requireStudentAccount } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bindStudentToClass } from "@/lib/lms";
import { authPath } from "@/lib/return-path";

export const dynamic = "force-dynamic";

export default async function ClassJoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const studioClass = await prisma.class.findUnique({
    where: { code: code.toLowerCase() },
    include: { teacher: { select: { name: true } } },
  });
  if (!studioClass || studioClass.archived) notFound();

  const student = await requireStudentAccount();
  if (!student) {
    redirect(authPath("signup", "student", `/join/${studioClass.code}`));
  }

  await bindStudentToClass(student.id, studioClass.code);
  redirect(student.onboardedAt ? "/student" : `/onboarding?next=${encodeURIComponent(`/join/${studioClass.code}`)}`);
}
