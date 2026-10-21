import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { middleware } from "@/middleware";
import { RETURN_PATH_HEADER } from "@/lib/return-path";

describe("return path header", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stores the page without its language prefix and overwrites a client header", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("NEXT_PUBLIC_MARKETING_URL", "");
    const request = new NextRequest("http://localhost:3000/vi/student/takes/abc?x=1", {
      headers: { [RETURN_PATH_HEADER]: "https://evil.example/teacher" },
    });
    const response = middleware(request);
    expect(response.headers.get(`x-middleware-request-${RETURN_PATH_HEADER}`)).toBe(
      "/student/takes/abc?x=1",
    );
  });
});
