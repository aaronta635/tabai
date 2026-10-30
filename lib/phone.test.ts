import { describe, expect, it } from "vitest";
import { phoneKey } from "@/lib/phone";

describe("phoneKey", () => {
  it("treats a local mobile and its country form as one number", () => {
    expect(phoneKey("0912 345 678")).toBe("84912345678");
    expect(phoneKey("+84 912 345 678")).toBe("84912345678");
  });

  it("keeps another country code as its digits", () => {
    expect(phoneKey("+1 415 555 2671")).toBe("14155552671");
  });

  it("refuses blanks, short text, and numbers that are not a phone", () => {
    expect(phoneKey("")).toBeNull();
    expect(phoneKey("   ")).toBeNull();
    expect(phoneKey("0912")).toBeNull();
    expect(phoneKey("student@studio.test")).toBeNull();
  });
});
