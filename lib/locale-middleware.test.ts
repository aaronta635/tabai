import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { middleware } from "@/middleware";
import { LOCALE_COOKIE } from "@/lib/constants";
import { LOCALE_HEADER } from "@/lib/locale-path";
import { RETURN_PATH_HEADER } from "@/lib/return-path";

function ask(url: string, cookie?: string) {
  const headers = new Headers();
  headers.set("host", new URL(url).host);
  if (cookie) headers.set("cookie", `${LOCALE_COOKIE}=${cookie}`);
  return middleware(new NextRequest(url, { headers }));
}

function location(response: Response) {
  return response.headers.get("location");
}

describe("locale middleware", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends / to /vi and a remembered English visit to /en", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("NEXT_PUBLIC_MARKETING_URL", "");

    const home = ask("http://localhost:3000/");
    expect(location(home)).toBe("http://localhost:3000/vi");
    expect(home.cookies.get(LOCALE_COOKIE)?.value).toBe("vi");

    const remembered = ask("http://localhost:3000/", "en");
    expect(location(remembered)).toBe("http://localhost:3000/en");
    expect(remembered.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("prefixes a bare app route and leaves api and auth alone", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("NEXT_PUBLIC_MARKETING_URL", "");

    expect(location(ask("http://localhost:3000/teacher"))).toBe("http://localhost:3000/vi/teacher");
    expect(location(ask("http://localhost:3000/login/student?next=%2Fjoin%2Fkmprt", "en"))).toBe(
      "http://localhost:3000/en/login/student?next=%2Fjoin%2Fkmprt",
    );
    expect(location(ask("http://localhost:3000/join/KMPRT"))).toBe("http://localhost:3000/vi/join/KMPRT");

    const health = ask("http://localhost:3000/api/health");
    expect(location(health)).toBeNull();
    expect(health.headers.get("x-middleware-next")).toBe("1");

    const callback = ask("http://localhost:3000/auth/callback?code=abc");
    expect(location(callback)).toBeNull();
    expect(callback.headers.get(`x-middleware-request-${RETURN_PATH_HEADER}`)).toBe(
      "/auth/callback?code=abc",
    );
  });

  it("rewrites a prefixed address onto the existing page and sets that locale", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("NEXT_PUBLIC_MARKETING_URL", "");

    const response = ask("http://localhost:3000/en/teacher/classes?x=1");
    expect(location(response)).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/teacher/classes?x=1");
    expect(response.headers.get(`x-middleware-request-${LOCALE_HEADER}`)).toBe("en");
    expect(response.headers.get(`x-middleware-request-${RETURN_PATH_HEADER}`)).toBe(
      "/teacher/classes?x=1",
    );
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe("en");
  });

  it("keeps the language prefix when a split marketing host sends someone to the app", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.paramuzic.com");
    vi.stubEnv("NEXT_PUBLIC_MARKETING_URL", "https://paramuzic.com");

    expect(location(ask("https://paramuzic.com/"))).toBe("https://paramuzic.com/vi");
    expect(location(ask("https://paramuzic.com/teacher", "en"))).toBe(
      "https://app.paramuzic.com/en/teacher",
    );
    expect(location(ask("https://paramuzic.com/en/login/student"))).toBe(
      "https://app.paramuzic.com/en/login/student",
    );
    expect(location(ask("https://app.paramuzic.com/"))).toBe("https://paramuzic.com/");
    expect(location(ask("https://app.paramuzic.com/vi"))).toBe("https://paramuzic.com/vi");
    expect(location(ask("https://paramuzic.com/auth/callback"))).toBe(
      "https://app.paramuzic.com/auth/callback",
    );
    expect(location(ask("https://paramuzic.com/api/health"))).toBeNull();
  });
});
