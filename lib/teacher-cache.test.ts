import { describe, expect, it } from "vitest";
import { teacherCountsTag, teacherPulseTag } from "@/lib/teacher-cache";

describe("teacher hot-path tags", () => {
  it("keys counts and pulse by teacher", () => {
    expect(teacherCountsTag("t1")).toBe("teacher:t1:counts");
    expect(teacherPulseTag("t1")).toBe("teacher:t1:pulse");
  });
});
