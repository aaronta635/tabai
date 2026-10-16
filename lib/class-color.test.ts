import { describe, expect, it } from "vitest";
import { CLASS_COLORS, classColor } from "@/lib/class-color";

describe("classColor", () => {
  it("keeps the same color for the same class", () => {
    expect(classColor("cls_guitar_monday")).toBe(classColor("cls_guitar_monday"));
  });

  it("only uses the Howl0 palette", () => {
    for (const id of ["a", "b", "class_1", "class_2", "c".repeat(40)]) {
      expect(CLASS_COLORS).toContain(classColor(id));
    }
  });

  it("does not paint every class the same color", () => {
    const colors = ["a", "b", "c", "d", "e", "f", "g", "h"].map((id) => classColor(id));
    expect(new Set(colors).size).toBeGreaterThan(1);
  });
});
