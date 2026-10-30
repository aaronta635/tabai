import Link from "next/link";
import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readTeacherSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { StudioTitle } from "@/components/home/feed";
import { prisma } from "@/lib/prisma";

export default async function TeacherSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const teacher = await readTeacherSession();
  if (!teacher) redirect(signInPath("tutor", "/teacher"));
  const locale = await getLocale();
  const t = await getMessages(locale);
  const q = (await searchParams).q?.trim() ?? "";

  const [classes, students, pieces] = q
    ? await Promise.all([
        prisma.class.findMany({
          where: { teacherId: teacher.id, archived: false, name: { contains: q, mode: "insensitive" } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
          take: 20,
        }),
        prisma.student.findMany({
          where: { teacherId: teacher.id, NOT: { name: "anonymised" }, name: { contains: q, mode: "insensitive" } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
          take: 20,
        }),
        prisma.piece.findMany({
          where: { teacherId: teacher.id, title: { contains: q, mode: "insensitive" } },
          select: { id: true, title: true },
          orderBy: { title: "asc" },
          take: 20,
        }),
      ])
    : [[], [], []];

  const groups = [
    { title: t.teacher.navClasses, rows: classes.map((row) => ({ href: `/teacher/classes/${row.id}`, label: row.name })) },
    { title: t.teacher.rosterTitle, rows: students.map((row) => ({ href: "/teacher/roster", label: row.name })) },
    { title: t.teacher.navCurriculum, rows: pieces.map((row) => ({ href: `/teacher/curriculum/${row.id}`, label: row.title })) },
  ].filter((group) => group.rows.length > 0);

  return (
    <div className="space-y-6">
      <StudioTitle title={t.studio.search} />
      {!q ? <p className="text-ink-soft">{t.studio.searchPrompt}</p> : null}
      {q && groups.length === 0 ? <p className="text-ink-soft">{t.studio.searchEmpty}</p> : null}
      {groups.map((group) => (
        <section key={group.title} className="space-y-2">
          <h2 className="font-display text-base">{group.title}</h2>
          <ul className="studio-panel divide-y divide-ink/10">
            {group.rows.map((row) => (
              <li key={`${row.href}:${row.label}`}>
                <Link href={row.href} className="block px-4 py-3 font-semibold">
                  {row.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
