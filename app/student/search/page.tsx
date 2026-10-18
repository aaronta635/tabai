import Link from "next/link";
import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readStudentSession } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export default async function StudentSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const student = await readStudentSession();
  if (!student) redirect(signInPath("student", "/student"));
  const locale = await getLocale();
  const t = await getMessages(locale);
  const q = (await searchParams).q?.trim() ?? "";

  const [classes, pieces] = q
    ? await Promise.all([
        prisma.class.findMany({
          where: {
            archived: false,
            name: { contains: q, mode: "insensitive" },
            memberships: { some: { studentId: student.id } },
          },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
          take: 20,
        }),
        prisma.piece.findMany({
          where: {
            title: { contains: q, mode: "insensitive" },
            assignments: {
              some: {
                OR: [
                  { studentId: student.id },
                  { class: { memberships: { some: { studentId: student.id } } } },
                ],
              },
            },
          },
          select: { title: true, code: true },
          orderBy: { title: "asc" },
          take: 20,
        }),
      ])
    : [[], []];

  const groups = [
    { title: t.student.navClasses, rows: classes.map((row) => ({ href: `/student/classes/${row.id}`, label: row.name })) },
    { title: t.student.navWork, rows: pieces.map((row) => ({ href: `/student/work/${row.code}`, label: row.title })) },
  ].filter((group) => group.rows.length > 0);

  return (
    <div className="space-y-6">
      <h1 className="font-display">{t.studio.search}</h1>
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
