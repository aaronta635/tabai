import { describe, expect, it } from "vitest";
import { DEFAULT_PARTS, mailtoInvite, shelfName, shouldBackfillOrphanPieces } from "@/lib/lms";

describe("lms helpers", () => {
  it("builds a mailto invite with the join URL in the body", () => {
    const href = mailtoInvite("an@example.com", "Beginner", "https://howl0.com/join/abc123");
    expect(href.startsWith("mailto:an%40example.com?")).toBe(true);
    expect(href).toContain(encodeURIComponent("Join Beginner on PARA"));
    expect(href).toContain(encodeURIComponent("https://howl0.com/join/abc123"));
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
