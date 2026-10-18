import { describe, expect, it } from "vitest";
import {
  decodeSubmissionCursor,
  encodeSubmissionCursor,
  sliceSubmissionPage,
  submissionCursorWhere,
  submissionsHref,
  SUBMISSIONS_PAGE_SIZE,
} from "@/lib/submissions-page";

describe("submission cursor", () => {
  it("round-trips submittedAt and id", () => {
    const row = { submittedAt: new Date("2026-09-29T03:14:15.000Z"), id: "sub_9" };
    expect(decodeSubmissionCursor(encodeSubmissionCursor(row))).toEqual(row);
  });

  it("rejects junk", () => {
    expect(decodeSubmissionCursor(undefined)).toBeNull();
    expect(decodeSubmissionCursor("not-a-cursor")).toBeNull();
    expect(decodeSubmissionCursor(Buffer.from("no-id", "utf8").toString("base64url"))).toBeNull();
  });

  it("keeps ids that contain a pipe", () => {
    const row = { submittedAt: new Date("2026-01-01T00:00:00.000Z"), id: "a|b" };
    expect(decodeSubmissionCursor(encodeSubmissionCursor(row))).toEqual(row);
  });
});

describe("sliceSubmissionPage", () => {
  it("detects hasMore from the extra row", () => {
    const fetched = Array.from({ length: SUBMISSIONS_PAGE_SIZE + 1 }, (_, i) => i);
    expect(sliceSubmissionPage(fetched)).toEqual({
      rows: fetched.slice(0, SUBMISSIONS_PAGE_SIZE),
      hasMore: true,
    });
    expect(sliceSubmissionPage(fetched.slice(0, SUBMISSIONS_PAGE_SIZE))).toEqual({
      rows: fetched.slice(0, SUBMISSIONS_PAGE_SIZE),
      hasMore: false,
    });
  });
});

describe("submissionCursorWhere", () => {
  it("asks for strictly older rows", () => {
    const cursor = { submittedAt: new Date("2026-09-01T00:00:00.000Z"), id: "z" };
    expect(submissionCursorWhere(cursor)).toEqual({
      OR: [{ submittedAt: { lt: cursor.submittedAt } }, { submittedAt: cursor.submittedAt, id: { lt: "z" } }],
    });
    expect(submissionCursorWhere(null)).toEqual({});
  });
});

describe("submissionsHref", () => {
  it("keeps filters on the next page", () => {
    expect(
      submissionsHref({ classId: "c1", status: "new", cursor: "abc" }),
    ).toBe("/teacher/submissions?classId=c1&status=new&cursor=abc");
    expect(submissionsHref({})).toBe("/teacher/submissions");
  });
});
