import { describe, expect, it } from "vitest";
import { editorialCopy } from "@/lib/site/editorial-copy";

/** Every leaf path of a copy object, with its value. */
function leaves(value: unknown, path = ""): [string, unknown][] {
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => leaves(child, path ? `${path}.${key}` : key));
  }
  return [[path, value]];
}

describe("editorial copy", () => {
  it("has the same keys in English and Vietnamese", () => {
    expect(leaves(editorialCopy.vi).map(([key]) => key)).toEqual(leaves(editorialCopy.en).map(([key]) => key));
  });

  it("has no empty strings apart from the optional Vietnamese watch suffix", () => {
    for (const locale of ["en", "vi"] as const) {
      const empty = leaves(editorialCopy[locale]).filter(([key, text]) => text === "" && key !== "demo.watchSuffix");
      expect(empty).toEqual([]);
    }
  });

  it("keeps the demo ids aligned so videos and posters match", () => {
    expect(editorialCopy.vi.showcase.demos.map((demo) => demo.id)).toEqual(["take", "feedback", "next"]);
    expect(editorialCopy.en.showcase.demos.map((demo) => demo.id)).toEqual(["take", "feedback", "next"]);
  });
});
