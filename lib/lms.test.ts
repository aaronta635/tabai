import { describe, expect, it } from "vitest";
import { DEFAULT_PARTS, classJoinPath, displayClassCode, inviteEmailsFrom, mailtoInvite, newClassCode, shelfName, shouldBackfillOrphanPieces } from "@/lib/lms";

describe("lms helpers", () => {
  it("issues a five-letter class code without i, l, or o", () => {
    for (let i = 0; i < 20; i += 1) {
      expect(newClassCode()).toMatch(/^[abcdefghjkmnpqrstuvwxyz]{5}$/);
    }
    expect(displayClassCode("kmprt")).toBe("KMPRT");
    expect(displayClassCode("demo1234")).toBe("DEMO1234");
    expect(classJoinPath("kmprt")).toBe("/join/kmprt");
  });

  it("keeps piece codes eight characters", async () => {
    const { newPieceCode } = await import("@/lib/auth");
    expect(newPieceCode()).toMatch(/^[abcdefghijkmnopqrstuvwxyz23456789]{8}$/);
  });

  it("reads invite emails and skips blanks and duplicates", () => {
    expect(inviteEmailsFrom("  An@Example.com, an@example.com\nb@school.edu not-an-email ")).toEqual([
      "an@example.com",
      "b@school.edu",
    ]);
    expect(inviteEmailsFrom("")).toEqual([]);
  });

  it("builds a mailto invite that names the class code", () => {
    const href = mailtoInvite("an@example.com", "Beginner", "kmprt");
    expect(href.startsWith("mailto:an%40example.com?")).toBe(true);
    expect(href).toContain(encodeURIComponent("Join Beginner on PARA"));
    expect(href).toContain(encodeURIComponent("KMPRT"));
    expect(href).not.toContain("http");
  });

  it("ships three default curriculum parts", () => {
    expect(DEFAULT_PARTS.map((part) => part.name)).toEqual(["Beginner", "Mid", "Advanced"]);
  });

  it("shows starter shelves in the teacher's language until they rename them", () => {
    expect(shelfName("Beginner", "vi")).toBe("Cơ bản");
    expect(shelfName("Mid", "en")).toBe("Mid");
    expect(shelfName("Đệm hát", "vi")).toBe("Đệm hát");
  });

  it("skips orphan piece backfill when every piece already has a part", () => {
    expect(shouldBackfillOrphanPieces(0)).toBe(false);
    expect(shouldBackfillOrphanPieces(2)).toBe(true);
  });

  it("loads a student's assignments in one query", async () => {
    const { assignmentsWhereForStudent } = await import("@/lib/lms");
    expect(assignmentsWhereForStudent("stu_1")).toEqual({
      pieceId: { not: null },
      OR: [{ studentId: "stu_1" }, { class: { memberships: { some: { studentId: "stu_1" } } } }],
    });
  });
});
