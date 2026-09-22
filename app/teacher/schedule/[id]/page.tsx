import { redirect } from "next/navigation";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { weekParam } from "@/lib/schedule";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const teacher = await readTeacherSession();
  if (!teacher) redirect("/auth?next=/teacher/schedule");
  const { id } = await params;
  const session = await prisma.classSession.findFirst({
    where: { id, class: { teacherId: teacher.id } },
    select: { startsAt: true },
  });
  if (!session) redirect("/teacher/schedule");
  const w = weekParam(session.startsAt);
  redirect(`/teacher/schedule?w=${w}&session=${id}`);
}
