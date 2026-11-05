import { describe, expect, it } from "vitest";
import { assignmentLetter, deliverableAddress, replyLetter } from "@/lib/student-mail";

describe("deliverableAddress", () => {
  it("keeps a real address", () => {
    expect(deliverableAddress("  student@example.com ")).toBe("student@example.com");
  });

  it("skips an empty address and a placeholder", () => {
    expect(deliverableAddress("")).toBeNull();
    expect(deliverableAddress(null)).toBeNull();
    expect(deliverableAddress("zalo_1@oauth.para.local")).toBeNull();
    expect(deliverableAddress("facebook_1@oauth.para.local")).toBeNull();
  });
});

describe("student notices", () => {
  it("writes the new-song note in both languages", () => {
    expect(
      assignmentLetter({
        locale: "en",
        pieceTitle: "Romance",
        teacherName: "Lan",
        dueLabel: "12 Nov",
        url: "https://app.paramuzic.com/en/student/work/romance",
      }),
    ).toEqual({
      subject: "New song: Romance",
      text: "Lan assigned Romance. Due 12 Nov.\n\nOpen the piece: https://app.paramuzic.com/en/student/work/romance",
    });
    expect(
      assignmentLetter({
        locale: "vi",
        pieceTitle: "Romance",
        teacherName: "Lan",
        dueLabel: "12 thg 11",
        url: "https://app.paramuzic.com/vi/student/work/romance",
      }).subject,
    ).toBe("Bài mới: Romance");
  });

  it("writes the feedback note in both languages", () => {
    expect(replyLetter({ locale: "en", pieceTitle: "Romance", url: "https://app.paramuzic.com/en/student/takes/take-1" }).subject).toBe(
      "Feedback: Romance",
    );
    expect(replyLetter({ locale: "vi", pieceTitle: "Romance", url: "https://app.paramuzic.com/vi/student/takes/take-1" }).text).toContain(
      "Xem lần tập:",
    );
  });
});
