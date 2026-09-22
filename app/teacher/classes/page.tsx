import Link from "next/link";
import { redirect } from "next/navigation";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { createClass } from "@/app/teacher/lms-actions";
import { AddPanel } from "@/components/disclosure";

export default async function ClassesPage() {
  const teacher = await readTeacherSession();
  if (!teacher) redirect("/auth?next=/teacher/classes");
  const locale = await getLocale();
  const t = await getMessages(locale);
  const classes = await prisma.class.findMany({
    where: { teacherId: teacher.id, archived: false },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { memberships: true, assignments: true } },
    },
  });

  return (
    <div className="space-y-7">
      <h1 className="font-display text-3xl">{t.teacher.classesTitle}</h1>

      <AddPanel label={t.teacher.createClass} open={classes.length === 0}>
        <form action={createClass} className="flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1">
            <span className="field-label">{t.teacher.className}</span>
            <input name="name" required className="field mt-1.5" />
          </label>
          <button type="submit" className="btn">
            {t.teacher.createClass}
          </button>
        </form>
        <p className="mt-3 text-sm text-ink-soft">{t.teacher.classesHelp}</p>
      </AddPanel>

      {classes.length === 0 ? (
        <p className="text-ink-soft">{t.teacher.classesEmpty}</p>
      ) : (
        <div className="tile-grid">
          {classes.map((row) => (
            <Link key={row.id} href={`/teacher/classes/${row.id}`} className="tile">
              <span className="seat-row" aria-hidden>
                {Array.from({ length: Math.min(row._count.memberships, 8) }).map((_, seat) => (
                  <i key={seat} className="seat-taken" />
                ))}
                {row._count.memberships === 0 ? <i className="seat-free" /> : null}
              </span>
              <p className="tile-title pr-20">{row.name}</p>
              <p className="tile-meta">
                <span className="tabular">
                  {t.teacher.countStudents.replace("{n}", String(row._count.memberships))}
                </span>
                <span className="tabular">
                  {t.teacher.countAssigned.replace("{n}", String(row._count.assignments))}
                </span>
              </p>
              <span className="code-chip mt-4">/c/{row.code}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
