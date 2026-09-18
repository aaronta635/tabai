import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStudentAccount } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { JoinClassForm } from "@/components/student/join-class-form";

export const dynamic = "force-dynamic";

export default async function StudentHomePage() {
  const student = await requireStudentAccount();
  if (!student) redirect("/auth?role=student");
  if (!student.onboardedAt) redirect("/onboarding");

  const locale = await getLocale();
  const t = await getMessages(locale);
  const piece = student.teacherId
    ? await prisma.piece.findFirst({
        where: { teacherId: student.teacherId, archived: false },
        orderBy: { createdAt: "desc" },
        include: { teacher: { select: { name: true } } },
      })
    : null;

  const stageKey =
    student.stage === "in_class" ? t.student.stageInClass : t.student.stageExploring;
  const stageHelp =
    student.stage === "in_class" ? t.student.stageInClassHelp : t.student.stageExploringHelp;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.18em] uppercase text-ink-soft">{t.auth.studentKicker}</p>
        <h1 className="font-display mt-2 text-3xl">{t.student.homeHello.replace("{name}", student.name)}</h1>
        <p className="mt-2 rounded-2xl bg-cream px-4 py-3 text-sm">{stageKey}</p>
        <p className="mt-2 text-ink-soft">{stageHelp}</p>
      </div>

      {piece ? (
        <section className="lms-card space-y-3 p-5">
          <p className="text-xs tracking-[0.16em] uppercase text-beat">{piece.teacher?.name}</p>
          <h2 className="font-display text-2xl">{piece.title}</h2>
          {piece.note ? <p className="text-ink-soft">{piece.note}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Link href={`/l/${piece.code}`} className="rounded-full bg-beat px-4 py-2 text-sm text-white">
              {t.student.openPiece}
            </Link>
            <Link href={`/s/${student.token}`} className="rounded-full border border-ink/15 px-4 py-2 text-sm">
              {t.student.yourPage}
            </Link>
          </div>
        </section>
      ) : (
        <section className="lms-card p-5">
          <h2 className="font-display text-xl">{t.student.joinTitle}</h2>
          <p className="mt-2 text-sm text-ink-soft">{t.student.joinHelp}</p>
          <JoinClassForm
            placeholder={t.home.codePlaceholder}
            submit={t.home.openPiece}
            badCode={t.onboarding.badCode}
            otherClass={t.student.otherClass}
          />
        </section>
      )}
    </div>
  );
}
