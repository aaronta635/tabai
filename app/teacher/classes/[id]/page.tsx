import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appOrigin } from "@/lib/origin";
import { getLocale, getMessages } from "@/lib/i18n";
import { classJoinPath, mailtoInvite } from "@/lib/lms";
import { formatWhen } from "@/lib/when";
import { CopyLink } from "@/components/teacher/copy-link";
import { AddPanel, SectionPanel } from "@/components/disclosure";
import { approveMembershipForm, inviteByEmail, renameClass } from "@/app/teacher/lms-actions";

const CLASS_ASSIGNMENT_CAP = 40;

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const teacher = await readTeacherSession();
  if (!teacher) redirect(signInPath("tutor", "/teacher"));
  const { id } = await params;
  const studioClass = await prisma.class.findFirst({
    where: { id, teacherId: teacher.id, archived: false },
    // One SQL join beats four round trips to Tokyo.
    relationLoadStrategy: "join",
    include: {
      memberships: {
        include: { student: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      assignments: {
        include: { piece: { select: { id: true, title: true } }, part: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: CLASS_ASSIGNMENT_CAP,
      },
      sessions: { orderBy: { startsAt: "asc" }, take: 5 },
    },
  });
  if (!studioClass) notFound();
  const locale = await getLocale();
  const t = await getMessages(locale);
  const origin = await appOrigin();
  const joinUrl = `${origin}${classJoinPath(studioClass.code)}`;
  const roster = studioClass.memberships.filter((row) => row.student);
  const pendingInvites = studioClass.memberships.filter((row) => row.invitedEmail && !row.studentId);

  return (
    <div className="space-y-5">
      <header>
        <Link href="/teacher/classes" className="font-ui text-sm text-ink-soft hover:text-ink">
          ← {t.teacher.navClasses}
        </Link>
        <h1 className="font-display mt-3">{studioClass.name}</h1>
        <p className="page-meta">
          {t.teacher.countStudents.replace("{n}", String(roster.length))}
          {" · "}
          {t.teacher.countAssigned.replace("{n}", String(studioClass.assignments.length))}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="break-all text-sm">{joinUrl}</p>
          <CopyLink url={joinUrl} copy={t.teacher.copyLink} copied={t.teacher.linkCopied} />
        </div>
      </header>

      <AddPanel label={t.teacher.inviteEmail}>
        <form action={inviteByEmail} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="classId" value={studioClass.id} />
          <label className="min-w-0 flex-1">
            <span className="field-label">{t.teacher.inviteEmail}</span>
            <input
              type="email"
              name="email"
              required
              placeholder={t.teacher.inviteEmailPlaceholder}
              className="field mt-1.5"
            />
          </label>
          <button type="submit" className="btn">
            {t.teacher.makeInvite}
          </button>
        </form>
        <p className="mt-3 text-sm text-ink-soft">{t.teacher.inviteEmailHelp}</p>
        {pendingInvites.length > 0 ? (
          <ul className="mt-3 space-y-1.5 text-sm">
            {pendingInvites.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-2">
                <span>{row.invitedEmail}</span>
                <a
                  className="font-ui text-xs text-beat"
                  href={mailtoInvite(row.invitedEmail!, studioClass.name, joinUrl)}
                >
                  {t.teacher.inviteEmail}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </AddPanel>

      <SectionPanel title={t.teacher.roster} count={roster.length}>
        {roster.length === 0 ? (
          <p className="text-sm text-ink-soft">{t.teacher.rosterEmpty}</p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {roster.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate">{row.student!.name}</p>
                  <p className="font-ui truncate text-xs text-ink-soft">
                    {row.invitedEmail ?? row.student!.email}
                  </p>
                </div>
                {row.approvedAt ? (
                  <span className="font-ui text-xs text-ink-soft">{t.teacher.approved}</span>
                ) : (
                  <form action={approveMembershipForm}>
                    <input type="hidden" name="membershipId" value={row.id} />
                    <button type="submit" className="btn px-3 py-1.5 text-xs">
                      {t.teacher.approve}
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionPanel>

      <SectionPanel title={t.teacher.assignedWork} count={studioClass.assignments.length}>
        {studioClass.assignments.length === 0 ? (
          <p className="text-sm text-ink-soft">{t.teacher.assignedEmpty}</p>
        ) : (
          <table className="studio-table">
            <thead>
              <tr>
                <th>{t.teacher.colPiece}</th>
                <th>{t.teacher.due}</th>
              </tr>
            </thead>
            <tbody>
              {studioClass.assignments.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link
                      href={row.pieceId ? `/teacher/curriculum/${row.pieceId}` : "/teacher/curriculum"}
                      className="font-semibold"
                    >
                      {row.piece?.title ?? row.part?.name}
                    </Link>
                  </td>
                  <td className="text-sm text-ink-soft">{row.dueAt ? formatWhen(row.dueAt, locale) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionPanel>

      <SectionPanel title={t.teacher.upcoming} count={studioClass.sessions.length}>
        {studioClass.sessions.length === 0 ? (
          <p className="text-sm text-ink-soft">{t.teacher.scheduleEmpty}</p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {studioClass.sessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/teacher/schedule/${session.id}`}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span>{session.title || t.teacher.upcoming}</span>
                  <span className="font-ui tabular text-xs text-ink-soft">
                    {formatWhen(session.startsAt, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionPanel>

      <SectionPanel title={t.teacher.classSettings}>
        <form action={renameClass} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="classId" value={studioClass.id} />
          <label className="min-w-0 flex-1">
            <span className="field-label">{t.teacher.className}</span>
            <input name="name" defaultValue={studioClass.name} className="field mt-1.5" />
          </label>
          <button type="submit" className="btn btn-quiet">
            {t.teacher.rename}
          </button>
        </form>
        <p className="field-label mt-4">{t.teacher.linkTitle}</p>
        <p className="mt-1.5 break-all text-sm">{joinUrl}</p>
      </SectionPanel>
    </div>
  );
}
