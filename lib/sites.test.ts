import { afterEach, describe, expect, it, vi } from "vitest";
import { isMarketingHost, isProductHost, isProductPath, sitesAreSplit } from "@/lib/sites";

describe("sites", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is not split when origins match", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://howl0.com");
    vi.stubEnv("NEXT_PUBLIC_MARKETING_URL", "https://howl0.com");
    expect(sitesAreSplit()).toBe(false);
  });

  it("treats /teacher as a product path and locale as shared", () => {
    expect(isProductPath("/teacher/submissions")).toBe(true);
    expect(isProductPath("/c/abc")).toBe(true);
    expect(isProductPath("/api/locale")).toBe(false);
    expect(isProductPath("/")).toBe(false);
  });

  it("matches www and bare hosts when split", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.howl0.com");
    vi.stubEnv("NEXT_PUBLIC_MARKETING_URL", "https://howl0.com");
    expect(sitesAreSplit()).toBe(true);
    expect(isProductHost("www.app.howl0.com")).toBe(true);
    expect(isMarketingHost("www.howl0.com")).toBe(true);
    expect(isProductHost("howl0.com")).toBe(false);
  });
});
