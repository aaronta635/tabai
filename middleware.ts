import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE } from "@/lib/constants";
import { LOCALE_HEADER, skipsLocale, splitLocale, withLocale, type Locale } from "@/lib/locale-path";
import { RETURN_PATH_HEADER } from "@/lib/return-path";
import { isMarketingHost, isProductHost, isProductPath, marketingOrigin, productOrigin, sitesAreSplit } from "@/lib/sites";

function continueWithPath(request: NextRequest, pathname: string, search: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(RETURN_PATH_HEADER, `${pathname}${search}`);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

function remember(response: NextResponse, locale: Locale) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  });
  return response;
}

function rememberedLocale(request: NextRequest): Locale {
  return request.cookies.get(LOCALE_COOKIE)?.value === "en" ? "en" : "vi";
}

/** Supabase attaches ?code= to the site address when it does not return to /auth/callback. */
function rescueAuthCode(request: NextRequest) {
  if (!request.nextUrl.searchParams.get("code")) return null;
  const { pathname } = request.nextUrl;
  if (skipsLocale(pathname)) return null;
  if (splitLocale(pathname).pathname !== "/") return null;
  const dest = request.nextUrl.clone();
  dest.pathname = "/auth/callback";
  return NextResponse.redirect(dest);
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname, search } = request.nextUrl;
  const rescued = rescueAuthCode(request);
  if (rescued) return rescued;

  if (skipsLocale(pathname)) {
    if (!sitesAreSplit()) return continueWithPath(request, pathname, search);
    if (isMarketingHost(host) && isProductPath(pathname)) {
      return NextResponse.redirect(new URL(`${pathname}${search}`, productOrigin()));
    }
    if (isProductHost(host) && pathname === "/") {
      return NextResponse.redirect(new URL(`/${search}`, marketingOrigin()));
    }
    return continueWithPath(request, pathname, search);
  }

  const { locale, pathname: bare } = splitLocale(pathname);

  if (sitesAreSplit() && isProductHost(host) && bare === "/") {
    const landing = locale ? `/${locale}` : "/";
    return NextResponse.redirect(new URL(`${landing}${search}`, marketingOrigin()));
  }

  if (sitesAreSplit() && isMarketingHost(host) && isProductPath(bare)) {
    const chosen = locale ?? rememberedLocale(request);
    const target = locale ? pathname : withLocale(pathname, chosen);
    return remember(NextResponse.redirect(new URL(`${target}${search}`, productOrigin())), chosen);
  }

  if (!locale) {
    const chosen = rememberedLocale(request);
    const dest = request.nextUrl.clone();
    dest.pathname = withLocale(pathname, chosen);
    return remember(NextResponse.redirect(dest), chosen);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(RETURN_PATH_HEADER, `${bare}${search}`);
  requestHeaders.set(LOCALE_HEADER, locale);
  const url = request.nextUrl.clone();
  url.pathname = bare;
  return remember(NextResponse.rewrite(url, { request: { headers: requestHeaders } }), locale);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
