import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { formatDuration, formatWhen } from "@/lib/when";
import { StudioTitle } from "@/components/home/feed";
import { SectionPanel } from "@/components/disclosure";
import { PrefetchTakeVideos } from "@/components/teacher/prefetch-take-videos";
import { SubmissionCabinet } from "@/components/teacher/submission-cabinet";
import { isClaimableStatus } from "@/lib/forms";
import { classForTake, groupTakesByClassThenPiece } from "@/lib/submission-folders";
import {
  decodeSubmissionCursor,
  encodeSubmissionCursor,
  sliceSubmissionPage,
  submissionCursorWhere,
  submissionsHref,
  submissionsStudentWhere,
  SUBMISSIONS_PAGE_SIZE,
} from "@/lib/submissions-page";
import { approveStudentForm } from "@/app/teacher/actions";

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    classId?: string;
    status?: string;
    kind?: string;
    q?: string;
    from?: string;
    to?: string;
    cursor?: string;
  }>;
}) {
  const teacher = await readTeacherSession();
  if (!teacher) redirect(signInPath("tutor", "/teacher"));
  const locale = await getLocale();
  const t = await getMessages(locale);
  const { classId, status, kind, q, from, to, cursor: cursorParam } = await searchParams;

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

  const cursor = decodeSubmissionCursor(cursorParam);
  const cursorWhere = submissionCursorWhere(cursor);

  const [classes, fetched] = await Promise.all([
    prisma.class.findMany({
      where: { teacherId: teacher.id, archived: false },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.submission.findMany({
      where: {
        AND: [
          {
            piece: { teacherId: teacher.id },
            ...(kindFilter ? { kind: kindFilter } : { kind: { in: ["take", "overdub"] } }),
            ...(statusFilter ? { status: statusFilter } : {}),
            ...(submittedAt ? { submittedAt } : {}),
            ...submissionsStudentWhere(q),
            ...(classId
              ? {
                  OR: [
                    { piece: { assignments: { some: { classId } } } },
                    { student: { memberships: { some: { classId } } } },
                  ],
                }
              : {}),
          },
          ...(cursor ? [cursorWhere] : []),
        ],
      },
      select: {
        id: true,
        mediaId: true,
        submittedAt: true,
        status: true,
        kind: true,
        media: { select: { durationS: true } },
        student: {
          select: {
            id: true,
            name: true,
            approvedAt: true,
            memberships: { select: { class: { select: { id: true, name: true } } }, take: 1 },
          },
        },
        piece: {
          select: {
            id: true,
            title: true,
            assignments: { select: { class: { select: { id: true, name: true } } }, take: 4 },
          },
        },
      },
      orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      take: SUBMISSIONS_PAGE_SIZE + 1,
      relationLoadStrategy: "join",
    }),
  ]);

  const { rows, hasMore } = sliceSubmissionPage(fetched);
  const last = rows[rows.length - 1];
  const moreHref =
    hasMore && last
      ? submissionsHref({
          classId,
          status,
          kind,
          q,
          from,
          to,
          cursor: encodeSubmissionCursor(last),
        })
      : null;

  const activeFilters = [classId, status, kind, q, from, to].filter(Boolean).length;
  const kindLabels: Record<string, string> = {
    take: t.teacher.kindTake,
    practice: t.teacher.practice,
    overdub: t.teacher.overdub,
  };
  const statusLabels: Record<string, string> = {
    new: t.teacher.statusNew,
    drafted: t.teacher.statusDrafted,
    answered: t.teacher.answered,
    skipped: t.teacher.skip,
    pending: t.teacher.pending,
  };

  const filed = rows.map((row) => {
    const klass = classForTake({
      membershipClass: row.student.memberships[0]?.class ?? null,
      assignmentClass: row.piece.assignments.find((item) => item.class)?.class ?? null,
    });
    return {
      id: row.id,
      mediaId: row.mediaId,
      submittedAt: row.submittedAt,
      status: row.status,
      kind: [kindLabels[row.kind] ?? row.kind, formatDuration(row.media.durationS)].filter(Boolean).join(" · "),
      studentId: row.student.id,
      studentName: row.student.name,
      approved: Boolean(row.student.approvedAt),
      pieceId: row.piece.id,
      pieceTitle: row.piece.title,
      classId: klass?.id ?? null,
      className: klass?.name ?? null,
    };
  });

  const folders = groupTakesByClassThenPiece(filed, t.teacher.noClassFolder);
  const inbox = filed
    .filter((take) => !take.approved || isClaimableStatus(take.status))
    .map((take) => ({
      id: take.id,
      studentId: take.studentId,
      studentName: take.studentName,
      approved: take.approved,
      when: formatWhen(take.submittedAt, locale),
      status: take.status,
      kind: take.kind,
      pieceTitle: take.pieceTitle,
    }));

  const cabinetFolders = folders.map((folder) => ({
    ...folder,
    pieces: folder.pieces.map((piece) => ({
      ...piece,
      takes: piece.takes.map((take) => ({
        id: take.id,
        studentId: take.studentId,
        studentName: take.studentName,
        approved: take.approved,
        when: formatWhen(take.submittedAt, locale),
        status: take.status,
        kind: take.kind,
      })),
    })),
  }));

  const inboxIds = new Set(inbox.map((take) => take.id));
  const prefetchIds = [...filed.filter((take) => inboxIds.has(take.id)), ...filed.filter((take) => !inboxIds.has(take.id))]
    .map((take) => take.mediaId)
    .filter((id): id is string => Boolean(id));
  const done = Math.max(0, filed.length - inbox.length);

  return (
    <div className="teacher-inbox space-y-5">
      <PrefetchTakeVideos mediaIds={prefetchIds} />
      <StudioTitle
        title={t.teacher.submissionsTitle}
        meta={`${t.teacher.pageScope} · ${t.teacher.queueMeta
          .replace("{waiting}", String(inbox.length))
          .replace("{done}", String(done))}`}
      />

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

      {rows.length === 0 ? (
        <p className="tile text-ink-soft">{t.teacher.emptyQueue}</p>
      ) : (
        <SubmissionCabinet
          inbox={inbox}
          folders={cabinetFolders}
          copy={{
            needsReply: t.teacher.needsReply,
            emptyQueue: t.teacher.emptyQueue,
            loadMore: t.teacher.loadMore,
            approve: t.teacher.approve,
          }}
          approveAction={approveStudentForm}
          statusLabels={statusLabels}
          moreHref={moreHref}
        />
      )}
    </div>
  );
}
