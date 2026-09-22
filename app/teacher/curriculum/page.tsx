import { redirect } from "next/navigation";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { ensureDefaultCurriculum } from "@/lib/lms";
import { createCurriculumPart } from "@/app/teacher/lms-actions";
import { CurriculumBoard } from "@/components/teacher/curriculum-board";
import { ClassDropList } from "@/components/teacher/class-drop-list";
import { AddPanel } from "@/components/disclosure";

export default async function CurriculumPage() {
  const teacher = await readTeacherSession();
  if (!teacher) redirect("/auth?next=/teacher/curriculum");
  await ensureDefaultCurriculum(teacher.id);
  const locale = await getLocale();
  const t = await getMessages(locale);
  const [parts, classes, students] = await Promise.all([
    prisma.curriculumPart.findMany({
      where: { teacherId: teacher.id },
      orderBy: { sortOrder: "asc" },
      include: {
        pieces: { where: { archived: false }, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.class.findMany({
      where: { teacherId: teacher.id, archived: false },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    prisma.student.findMany({
      where: { teacherId: teacher.id, name: { not: "anonymised" } },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-7">
      <h1 className="font-display text-3xl">{t.teacher.curriculumTitle}</h1>

      <AddPanel label={t.teacher.addPart}>
        <form action={createCurriculumPart} className="flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1">
            <span className="field-label">{t.teacher.partName}</span>
            <input name="name" required className="field mt-1.5" />
          </label>
          <button type="submit" className="btn">
            {t.teacher.addPart}
          </button>
        </form>
        <p className="mt-3 text-sm text-ink-soft">{t.teacher.curriculumHelp}</p>
      </AddPanel>

      <CurriculumBoard parts={parts} classes={classes} students={students} />

      {classes.length > 0 ? (
        <div className="space-y-2">
          <p className="eyebrow">{t.teacher.dragHint}</p>
          <ClassDropList classes={classes} />
        </div>
      ) : null}
    </div>
  );
}
