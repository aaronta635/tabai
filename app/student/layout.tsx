import "@/styles/student/student.css";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { readStudentSession, studioOnboarded } from "@/lib/auth";
import { RETURN_PATH_HEADER, signInPath, studioReturn } from "@/lib/return-path";
import { getLocale } from "@/lib/i18n";
import { signedMediaUrl } from "@/lib/media-view";
import { prisma } from "@/lib/prisma";
import { StudentAppShell } from "@/components/student/app-shell";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await readStudentSession();
  const requested = (await headers()).get(RETURN_PATH_HEADER);
  if (!session) redirect(signInPath("student", requested ?? "/student"));
  if (!(await studioOnboarded(session, "student"))) {
    const back = studioReturn("student", requested);
    redirect(back ? `/onboarding?next=${encodeURIComponent(back)}` : "/onboarding");
  }
  const locale = await getLocale();
  const portrait = await prisma.student.findUnique({ where: { id: session.id }, select: { avatarUrl: true } });
  const avatarSrc = await signedMediaUrl(portrait?.avatarUrl ?? null);
  return (
    <StudentAppShell studentName={session.name} avatarSrc={avatarSrc} locale={locale === "en" ? "en" : "vi"}>
      {children}
    </StudentAppShell>
  );
}
