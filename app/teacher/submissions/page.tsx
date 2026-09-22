import Link from "next/link";
import { redirect } from "next/navigation";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { formatWhen } from "@/lib/when";
import { SectionPanel } from "@/components/disclosure";

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; status?: string; kind?: string; q?: string; from?: string; to?: string }>;
}) {
  const teacher = await readTeacherSession();
  if (!teacher) redirect("/auth?next=/teacher/submissions");
  const locale = await getLocale();
  const t = await getMessages(locale);
  const { classId, status, kind, q, from, to } = await searchParams;

  const kindFilter = kind === "practice" || kind === "overdub" || kind === "take" ? kind : undefined;
  const statusFilter =
    status === "new" || status === "drafted" || status === "answered" || status === "skipped" ? status : undefined;

  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  const submittedAt =
    fromDate && !Number.isNaN(fromDate.getTime())
      ? { gte: fromDate, ...(toDate && !Number.isNaN(toDate.getTime()) ? { lte: toDate } : {}) }
      : toDate && !Number.isNaN(toDate.getTime())
        ? { lte: toDate }
        : undefined;

  // One trip to Postgres, not two: the filter list and the table do not depend on each other.
  const [classes, rows] = await Promise.all([
    prisma.class.findMany({
      where: { teacherId: teacher.id, archived: false },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.submission.findMany({
      where: {
        piece: { teacherId: teacher.id },
        ...(kindFilter ? { kind: kindFilter } : { kind: { in: ["take", "overdub"] } }),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(submittedAt ? { submittedAt } : {}),
        ...(q
          ? { student: { name: { contains: q, mode: "insensitive" } } }
          : { student: { approvedAt: { not: null } } }),
        ...(classId
          ? {
              OR: [
                { piece: { assignments: { some: { classId } } } },
                { student: { memberships: { some: { classId } } } },
              ],
            }
          : {}),
      },
      include: {
        student: {
          select: {
            name: true,
            memberships: { include: { class: { select: { name: true } } }, take: 1 },
          },
        },
        piece: { select: { title: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: 80,
    }),
  ]);

  const activeFilters = [classId, status, kind, q, from, to].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl">{t.teacher.submissionsTitle}</h1>

      <SectionPanel title={t.teacher.filter} count={activeFilters || undefined} open={activeFilters > 0}>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label>
            <span className="field-label">{t.teacher.colClass}</span>
            <select name="classId" defaultValue={classId ?? ""} className="field mt-1.5">
              <option value="">{t.teacher.filterClass}</option>
              {classes.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">{t.teacher.colStatus}</span>
            <select name="status" defaultValue={status ?? ""} className="field mt-1.5">
              <option value="">{t.teacher.filterStatus}</option>
              <option value="new">{t.teacher.statusNew}</option>
              <option value="drafted">{t.teacher.statusDrafted}</option>
              <option value="answered">{t.teacher.answered}</option>
              <option value="skipped">{t.teacher.skip}</option>
            </select>
          </label>
          <label>
            <span className="field-label">{t.teacher.colKind}</span>
            <select name="kind" defaultValue={kind ?? ""} className="field mt-1.5">
              <option value="">{t.teacher.filterKind}</option>
              <option value="take">{t.teacher.kindTake}</option>
              <option value="practice">{t.teacher.practice}</option>
              <option value="overdub">{t.teacher.overdub}</option>
            </select>
          </label>
          <label>
            <span className="field-label">{t.teacher.fromDate}</span>
            <input type="date" name="from" defaultValue={from ?? ""} className="field mt-1.5" />
          </label>
          <label>
            <span className="field-label">{t.teacher.toDate}</span>
            <input type="date" name="to" defaultValue={to ?? ""} className="field mt-1.5" />
          </label>
          <label>
            <span className="field-label">{t.teacher.colStudent}</span>
            <input name="q" defaultValue={q ?? ""} placeholder={t.teacher.searchName} className="field mt-1.5" />
          </label>
          <button type="submit" className="btn lg:col-span-3 lg:justify-self-start">
            {t.teacher.filter}
          </button>
        </form>
        <p className="mt-3 text-sm text-ink-soft">{t.teacher.submissionsHelp}</p>
      </SectionPanel>

      <div className="tile overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.12em] text-ink-soft">
              <th className="px-3 py-2">{t.teacher.colTime}</th>
              <th className="px-3 py-2">{t.teacher.colStudent}</th>
              <th className="px-3 py-2">{t.teacher.colClass}</th>
              <th className="px-3 py-2">{t.teacher.colPiece}</th>
              <th className="px-3 py-2">{t.teacher.colKind}</th>
              <th className="px-3 py-2">{t.teacher.colStatus}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-ink-soft">
                  {t.teacher.emptyQueue}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-ink/10">
                  <td className="tabular px-3 py-3">
                    <Link href={`/teacher/submissions/${row.id}`} className="block">
                      {formatWhen(row.submittedAt, locale)}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <Link href={`/teacher/submissions/${row.id}`}>{row.student.name}</Link>
                  </td>
                  <td className="px-3 py-3">{row.student.memberships[0]?.class.name ?? "—"}</td>
                  <td className="px-3 py-3">{row.piece.title}</td>
                  <td className="px-3 py-3">{row.kind}</td>
                  <td className="px-3 py-3">{row.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
