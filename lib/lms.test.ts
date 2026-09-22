import { describe, expect, it } from "vitest";
import { DEFAULT_PARTS, mailtoInvite } from "@/lib/lms";

describe("lms helpers", () => {
  it("builds a mailto invite with the join URL in the body", () => {
    const href = mailtoInvite("an@example.com", "Beginner", "https://howl0.com/c/abc123");
    expect(href.startsWith("mailto:an%40example.com?")).toBe(true);
    expect(href).toContain(encodeURIComponent("Join Beginner on howl0"));
    expect(href).toContain(encodeURIComponent("https://howl0.com/c/abc123"));
  });

  it("ships three default curriculum parts", () => {
    expect(DEFAULT_PARTS.map((part) => part.name)).toEqual(["Beginner", "Mid", "Advanced"]);
  });

  it("loads a student's assignments in one query", async () => {
    const { assignmentsWhereForStudent } = await import("@/lib/lms");
    expect(assignmentsWhereForStudent("stu_1")).toEqual({
      pieceId: { not: null },
      OR: [{ studentId: "stu_1" }, { class: { memberships: { some: { studentId: "stu_1" } } } }],
    });
  });
});
