import { redirect } from "next/navigation";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { initialsOf } from "@/lib/initials";
import { updateTeacherProfile } from "@/app/teacher/lms-actions";

export default async function TeacherProfilePage() {
  const session = await readTeacherSession();
  if (!session) redirect("/auth?next=/teacher/profile");
  const teacher = await prisma.teacher.findUnique({
    where: { id: session.id },
    select: { name: true, email: true },
  });
  if (!teacher) redirect("/auth?role=tutor");
  const locale = await getLocale();
  const t = await getMessages(locale);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <span className="avatar-btn font-ui" aria-hidden>
          {initialsOf(teacher.name)}
        </span>
        <h1 className="font-display text-3xl">{teacher.name}</h1>
      </header>
      <form action={updateTeacherProfile} className="tile space-y-3">
        <label className="block">
          <span className="field-label">{t.onboarding.name}</span>
          <input name="name" required defaultValue={teacher.name} className="field mt-1.5" />
        </label>
        <p className="text-sm text-ink-soft">
          {t.teacher.profileEmail}: {teacher.email || "—"}
        </p>
        <button type="submit" className="btn">
          {t.teacher.saveProfile}
        </button>
      </form>
    </div>
  );
}
