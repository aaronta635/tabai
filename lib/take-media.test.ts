import { describe, expect, it } from "vitest";
import { isOwnTakeMedia, studentTakeFolder } from "@/lib/take-media";

const owner = { teacherId: "t1", pieceId: "p1", studentId: "s1" };

describe("isOwnTakeMedia", () => {
  it("accepts a take uploaded to this student's folder", () => {
    expect(isOwnTakeMedia(`${studentTakeFolder(owner)}m1`, owner)).toBe(true);
  });

  it("rejects the piece tutorial and sheet", () => {
    expect(isOwnTakeMedia("teachers/t1/pieces/p1/tutorial/m2.mp4", owner)).toBe(false);
    expect(isOwnTakeMedia("teachers/t1/pieces/p1/sheet/m3.pdf", owner)).toBe(false);
  });

  it("rejects another student's take and another piece", () => {
    expect(isOwnTakeMedia("teachers/t1/pieces/p1/students/s2/m4", owner)).toBe(false);
    expect(isOwnTakeMedia("teachers/t2/pieces/p9/students/s1/m5", owner)).toBe(false);
  });

  it("does not match a student id that only shares a prefix", () => {
    expect(isOwnTakeMedia("teachers/t1/pieces/p1/students/s10/m6", owner)).toBe(false);
  });
});
