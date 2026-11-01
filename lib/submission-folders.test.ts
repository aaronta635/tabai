import { describe, expect, it } from "vitest";
import { shouldKeepTakeFile, takeMediaIsShared } from "@/lib/deletion";
import { classForTake, groupTakesByClassThenPiece } from "@/lib/submission-folders";

const piece = {
  sheetMediaId: "sheet-1",
  tutorialMediaId: "tut-1",
  clipMediaId: null,
  referenceMediaId: "tut-1",
};

describe("takeMediaIsShared", () => {
  it("keeps the tutorial file if the take reused it", () => {
    expect(takeMediaIsShared({ mediaId: "tut-1", otherSubmissionCount: 0, piece })).toBe(true);
  });

  it("drops a take-only video", () => {
    expect(takeMediaIsShared({ mediaId: "take-9", otherSubmissionCount: 0, piece })).toBe(false);
  });

  it("keeps media still used by another take", () => {
    expect(takeMediaIsShared({ mediaId: "take-9", otherSubmissionCount: 1, piece })).toBe(true);
  });
});

describe("shouldKeepTakeFile", () => {
  const owner = { teacherId: "t1", pieceId: "p1", studentId: "s1" };

  it("keeps a teacher's tutorial even when the take points at it", () => {
    expect(
      shouldKeepTakeFile({
        mediaId: "tut-1",
        storagePath: "teachers/t1/pieces/p1/tutorial/m2.mp4",
        otherSubmissionCount: 0,
        ...owner,
        piece,
      }),
    ).toBe(true);
  });

  it("keeps another student's upload", () => {
    expect(
      shouldKeepTakeFile({
        mediaId: "take-9",
        storagePath: "teachers/t1/pieces/p1/students/s2/m4",
        otherSubmissionCount: 0,
        ...owner,
        piece,
      }),
    ).toBe(true);
  });

  it("drops this student's own take video", () => {
    expect(
      shouldKeepTakeFile({
        mediaId: "take-9",
        storagePath: "teachers/t1/pieces/p1/students/s1/m4",
        otherSubmissionCount: 0,
        ...owner,
        piece,
      }),
    ).toBe(false);
  });
});

describe("groupTakesByClassThenPiece", () => {
  it("files takes into class then piece folders, waiting first", () => {
    const folders = groupTakesByClassThenPiece(
      [
        {
          id: "a",
          submittedAt: new Date("2026-09-01"),
          status: "answered",
          kind: "take",
          studentId: "s-an",
          studentName: "An",
          approved: true,
          pieceId: "p1",
          pieceTitle: "Season",
          classId: "c1",
          className: "Beginner",
        },
        {
          id: "b",
          submittedAt: new Date("2026-09-02"),
          status: "drafted",
          kind: "take",
          studentId: "s-binh",
          studentName: "Binh",
          approved: true,
          pieceId: "p1",
          pieceTitle: "Season",
          classId: "c1",
          className: "Beginner",
        },
        {
          id: "c",
          submittedAt: new Date("2026-09-03"),
          status: "drafted",
          kind: "take",
          studentId: "s-chi",
          studentName: "Chi",
          approved: true,
          pieceId: "p2",
          pieceTitle: "Easy 1",
          classId: null,
          className: null,
        },
      ],
      "No class",
    );

    expect(folders.map((folder) => folder.className)).toEqual(["Beginner", "No class"]);
    expect(folders[0]?.waiting).toBe(1);
    expect(folders[0]?.pieces[0]?.takes.map((take) => take.id)).toEqual(["b", "a"]);
    expect(classForTake({ membershipClass: { id: "c1", name: "Beginner" } })).toEqual({
      id: "c1",
      name: "Beginner",
    });
  });
});
