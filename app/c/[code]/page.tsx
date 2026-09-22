import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireStudentAccount } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { bindStudentToClass } from "@/lib/lms";
import { BrandMark } from "@/components/landing/brand-mark";
import { GuestJoinForm } from "@/components/student/guest-join-form";

export const dynamic = "force-dynamic";

export default async function ClassJoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const studioClass = await prisma.class.findUnique({
    where: { code: code.toLowerCase() },
    include: { teacher: { select: { name: true } } },
  });
  if (!studioClass || studioClass.archived) notFound();

  const student = await requireStudentAccount();
  const locale = await getLocale();
  const t = await getMessages(locale);

  if (student) {
    const result = await bindStudentToClass(student.id, studioClass.code);
    if (result && "error" in result && result.error === "otherClass") {
      return (
        <main className="student-shell mx-auto min-h-dvh max-w-lg px-5 py-8">
          <Link href="/" aria-label={t.brand} className="mb-6 inline-flex">
            <BrandMark />
          </Link>
          <h1 className="font-display text-3xl">{studioClass.name}</h1>
          <p className="mt-6 rounded-2xl bg-cream px-4 py-3 text-sm">{t.student.otherClass}</p>
        </main>
      );
    }
    redirect(student.onboardedAt ? "/student" : "/onboarding");
  }

  return (
    <main className="student-shell mx-auto min-h-dvh max-w-lg px-5 py-8">
      <Link href="/" aria-label={t.brand} className="mb-6 inline-flex">
        <BrandMark />
      </Link>
      <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">{studioClass.teacher.name}</p>
      <h1 className="font-display mt-2 text-3xl">{studioClass.name}</h1>
      <p className="mt-3 text-ink-soft">{t.student.joinHelp}</p>
      <GuestJoinForm
        code={studioClass.code}
        labels={{
          name: t.student.name,
          age: t.student.age,
          adult: t.student.adult,
          under18: t.student.under18,
          contact: t.student.contact,
          zalo: t.student.zalo,
          consent: t.student.consent,
          under18Line: t.student.under18Line,
          join: t.student.joinClass,
          badCode: t.onboarding.badCode,
          otherClass: t.student.otherClass,
          signIn: t.auth.studentSignIn,
        }}
      />
      <p className="mt-6 text-sm text-ink-soft">
        <Link href={`/auth?role=student&next=/c/${studioClass.code}`} className="text-beat">
          {t.auth.studentSignIn}
        </Link>
      </p>
    </main>
  );
}
