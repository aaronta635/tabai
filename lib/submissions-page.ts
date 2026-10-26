export const SUBMISSIONS_PAGE_SIZE = 24;

export type SubmissionCursor = { submittedAt: Date; id: string };

export function encodeSubmissionCursor(row: SubmissionCursor) {
  return Buffer.from(`${row.submittedAt.toISOString()}|${row.id}`, "utf8").toString("base64url");
}

export function decodeSubmissionCursor(raw: string | undefined): SubmissionCursor | null {
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const sep = decoded.indexOf("|");
    if (sep <= 0 || sep === decoded.length - 1) return null;
    const submittedAt = new Date(decoded.slice(0, sep));
    const id = decoded.slice(sep + 1);
    if (!id || Number.isNaN(submittedAt.getTime())) return null;
    return { submittedAt, id };
  } catch {
    return null;
  }
}

export function sliceSubmissionPage<T>(rows: T[], pageSize = SUBMISSIONS_PAGE_SIZE) {
  const hasMore = rows.length > pageSize;
  return { rows: hasMore ? rows.slice(0, pageSize) : rows, hasMore };
}

/** Newer pages first: rows strictly older than the last row on the previous page. */
export function submissionCursorWhere(cursor: SubmissionCursor | null) {
  if (!cursor) return {};
  return {
    OR: [
      { submittedAt: { lt: cursor.submittedAt } },
      { submittedAt: cursor.submittedAt, id: { lt: cursor.id } },
    ],
  };
}

/** Name search is extra; unapproved students stay in the default list. */
export function submissionsStudentWhere(q?: string) {
  const name = q?.trim();
  if (!name) return {};
  return { student: { name: { contains: name, mode: "insensitive" as const } } };
}

export function submissionsHref(params: {
  classId?: string;
  status?: string;
  kind?: string;
  q?: string;
  from?: string;
  to?: string;
  cursor?: string;
}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `/teacher/submissions?${query}` : "/teacher/submissions";
}
