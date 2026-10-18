import { afterEach, describe, expect, it, vi } from "vitest";
import { originFromRequest, PRODUCTION_APP_ORIGIN, resolveAppOrigin } from "@/lib/app-origin";

describe("resolveAppOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps a public request host even when env is localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(resolveAppOrigin("https://paramuzic.com")).toBe("https://paramuzic.com");
  });

  it("uses paramuzic.com in production when env and request are localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("VERCEL", "1");
    expect(resolveAppOrigin("http://localhost:3000")).toBe(PRODUCTION_APP_ORIGIN);
  });

  it("keeps localhost off Vercel", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("VERCEL", "");
    expect(resolveAppOrigin("http://localhost:3000")).toBe("http://localhost:3000");
  });

  it("reads x-forwarded-host from the request", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    const origin = originFromRequest({
      nextUrl: { origin: "http://localhost:3000" },
      headers: {
        get(name: string) {
          if (name === "x-forwarded-host") return "paramuzic.com";
          if (name === "x-forwarded-proto") return "https";
          return null;
        },
      },
    });
    expect(origin).toBe("https://paramuzic.com");
  });
});
