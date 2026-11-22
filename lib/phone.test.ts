import { describe, expect, it } from "vitest";
import { phoneKey } from "@/lib/phone";

describe("phoneKey", () => {
  it("normalises Vietnamese numbers on the Vietnamese locale", () => {
    expect(phoneKey("0912 345 678", "vi")).toBe("84912345678");
    expect(phoneKey("+84 912 345 678", "vi")).toBe("84912345678");
    expect(phoneKey("912-345-678", "vi")).toBe("84912345678");
  });

  it("normalises Australian numbers on the English locale", () => {
    expect(phoneKey("0412 345 678", "en")).toBe("61412345678");
    expect(phoneKey("+61 412 345 678", "en")).toBe("61412345678");
    expect(phoneKey("412 345 678", "en")).toBe("61412345678");
  });

  it("keeps an explicit country prefix regardless of page locale", () => {
    expect(phoneKey("+84 912 345 678", "en")).toBe("84912345678");
    expect(phoneKey("+61 412 345 678", "vi")).toBe("61412345678");
  });

  it("uses unambiguous mobile prefixes before locale", () => {
    expect(phoneKey("0412 345 678", "vi")).toBe("61412345678");
    expect(phoneKey("0912 345 678", "en")).toBe("84912345678");
  });

  it("resolves shared local prefixes by page locale", () => {
    expect(phoneKey("03 1234 5678", "vi")).toBe("84312345678");
    expect(phoneKey("03 1234 5678", "en")).toBe("61312345678");
    expect(phoneKey("07 1234 5678", "vi")).toBe("84712345678");
    expect(phoneKey("07 1234 5678", "en")).toBe("61712345678");
    expect(phoneKey("08 1234 5678", "vi")).toBe("84812345678");
    expect(phoneKey("08 1234 5678", "en")).toBe("61812345678");
  });

  it("does not map Australian locals to Vietnamese keys", () => {
    expect(phoneKey("0412 345 678", "vi")).toBe("61412345678");
    expect(phoneKey("0412 345 678", "en")).toBe("61412345678");
    expect(phoneKey("0912 345 678", "vi")).toBe("84912345678");
    expect(phoneKey("0912 345 678", "vi")).not.toBe(phoneKey("0412 345 678", "en"));
  });

  it("accepts other countries only with a leading plus", () => {
    expect(phoneKey("+1 415 555 2671", "vi")).toBe("14155552671");
    expect(phoneKey("1 415 555 2671", "en")).toBeNull();
  });

  it("refuses blanks, short text, messenger links, and invalid numbers", () => {
    expect(phoneKey("", "vi")).toBeNull();
    expect(phoneKey("   ", "en")).toBeNull();
    expect(phoneKey("0912", "vi")).toBeNull();
    expect(phoneKey("student@studio.test", "vi")).toBeNull();
    expect(phoneKey("https://m.me/para.student", "en")).toBeNull();
    expect(phoneKey("m.me/para.student", "vi")).toBeNull();
  });
});