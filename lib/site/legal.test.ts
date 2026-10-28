import { describe, expect, it } from "vitest";
import { legal } from "@/lib/site/legal";

describe("legal pages", () => {
  it("names both operators in Vietnamese and English", () => {
    for (const locale of ["en", "vi"] as const) {
      const docs = [legal[locale].privacy, legal[locale].terms, legal[locale].deletion];
      for (const document of docs) {
        const text = [document.intro, ...document.sections.flatMap((section) => section.paragraphs)].join("\n");
        expect(text).toContain("Nguyen Ta");
        expect(text).toContain("Thanh Phong Nguyen");
      }
      const privacy = [legal[locale].privacy.intro, ...legal[locale].privacy.sections.flatMap((section) => section.paragraphs)].join("\n");
      expect(privacy).toContain("aaronta635@gmail.com");
    }
  });

  it("says the Vietnamese text controls", () => {
    expect(legal.en.privacy.sections[0]?.paragraphs.join(" ")).toContain("Vietnamese text controls");
    expect(legal.vi.terms.sections[0]?.paragraphs.join(" ")).toContain("bản tiếng Việt được dùng");
  });
});
