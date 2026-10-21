export const LOCALES = ["vi", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** Set on the rewritten request so server components read the address, not only the cookie. */
export const LOCALE_HEADER = "x-locale";

export function localeFrom(header: string | null | undefined, cookie: string | null | undefined): Locale {
  if (header === "en" || header === "vi") return header;
  return cookie === "en" ? "en" : "vi";
}

/** `/vi/teacher` → `{ locale: "vi", pathname: "/teacher" }`. Unprefixed paths stay as they are. */
export function splitLocale(pathname: string): { locale: Locale | null; pathname: string } {
  const match = /^\/(vi|en)(?=\/|$)/.exec(pathname);
  if (!match) return { locale: null, pathname };
  const rest = pathname.slice(match[0].length);
  return { locale: match[1] as Locale, pathname: rest === "" ? "/" : rest };
}

export function withLocale(pathname: string, locale: Locale) {
  if (pathname === "/") return `/${locale}`;
  return `/${locale}${pathname}`;
}

/** Sign-in callbacks and API routes stay off the language prefix. */
export function skipsLocale(pathname: string) {
  return pathname === "/api" || pathname.startsWith("/api/") || pathname === "/auth" || pathname.startsWith("/auth/");
}
