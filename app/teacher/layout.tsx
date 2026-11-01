import "@/styles/teacher/teacher.css";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { readTeacherSession, studioOnboarded } from "@/lib/auth";
import { RETURN_PATH_HEADER, signInPath, studioReturn } from "@/lib/return-path";
import { getLocale } from "@/lib/i18n";
import { signedMediaUrl } from "@/lib/media-view";
import { prisma } from "@/lib/prisma";
import { TeacherAppShell } from "@/components/teacher/app-shell";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await readTeacherSession();
  const requested = (await headers()).get(RETURN_PATH_HEADER);
  if (!session) redirect(signInPath("tutor", requested ?? "/teacher"));
  if (!(await studioOnboarded(session, "teacher"))) {
    const back = studioReturn("tutor", requested);
    redirect(back ? `/onboarding?next=${encodeURIComponent(back)}` : "/onboarding");
  }
  const locale = await getLocale();
  const portrait = await prisma.teacher.findUnique({ where: { id: session.id }, select: { avatarUrl: true } });
  const avatarSrc = await signedMediaUrl(portrait?.avatarUrl ?? null);
  return (
    <TeacherAppShell teacherName={session.name} avatarSrc={avatarSrc} locale={locale === "en" ? "en" : "vi"}>
      {children}
    </TeacherAppShell>
  );
}
