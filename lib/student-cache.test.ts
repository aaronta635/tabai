import { describe, expect, it } from "vitest";
import { studentCountsTag } from "@/lib/student-cache";

describe("student hot-path tags", () => {
  it("keys waiting counts by student", () => {
    expect(studentCountsTag("s1")).toBe("student:s1:counts");
  });
});
