import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { RETURN_PATH_HEADER } from "@/lib/return-path";
import { isMarketingHost, isProductHost, isProductPath, marketingOrigin, productOrigin, sitesAreSplit } from "@/lib/sites";

function continueWithPath(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const { pathname, search } = request.nextUrl;
  requestHeaders.set(RETURN_PATH_HEADER, `${pathname}${search}`);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export function middleware(request: NextRequest) {
  if (!sitesAreSplit()) return continueWithPath(request);

  const host = request.headers.get("host") ?? "";
  const { pathname, search } = request.nextUrl;

  if (isMarketingHost(host) && isProductPath(pathname)) {
    return NextResponse.redirect(new URL(`${pathname}${search}`, productOrigin()));
  }

  if (isProductHost(host) && pathname === "/") {
    return NextResponse.redirect(new URL(`/${search}`, marketingOrigin()));
  }

  return continueWithPath(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
