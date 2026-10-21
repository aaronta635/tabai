import { describe, expect, it } from "vitest";
import { localeFrom, skipsLocale, splitLocale, withLocale } from "@/lib/locale-path";

describe("locale paths", () => {
  it("splits a language prefix off the existing route", () => {
    expect(splitLocale("/vi")).toEqual({ locale: "vi", pathname: "/" });
    expect(splitLocale("/en/teacher/classes")).toEqual({ locale: "en", pathname: "/teacher/classes" });
    expect(splitLocale("/teacher")).toEqual({ locale: null, pathname: "/teacher" });
  });

  it("prefixes a bare path and leaves callbacks alone", () => {
    expect(withLocale("/", "vi")).toBe("/vi");
    expect(withLocale("/login/student", "en")).toBe("/en/login/student");
    expect(skipsLocale("/auth/callback")).toBe(true);
    expect(skipsLocale("/api/health")).toBe(true);
    expect(skipsLocale("/teacher")).toBe(false);
  });

  it("prefers the address over the remembered cookie", () => {
    expect(localeFrom("en", "vi")).toBe("en");
    expect(localeFrom(null, "en")).toBe("en");
    expect(localeFrom(null, undefined)).toBe("vi");
  });
});
