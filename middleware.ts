import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isMarketingHost, isProductHost, isProductPath, marketingOrigin, productOrigin, sitesAreSplit } from "@/lib/sites";

export function middleware(request: NextRequest) {
  if (!sitesAreSplit()) return NextResponse.next();

  const host = request.headers.get("host") ?? "";
  const { pathname, search } = request.nextUrl;

  if (isMarketingHost(host) && isProductPath(pathname)) {
    return NextResponse.redirect(new URL(`${pathname}${search}`, productOrigin()));
  }

  if (isProductHost(host) && pathname === "/") {
    return NextResponse.redirect(new URL(`/${search}`, marketingOrigin()));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
