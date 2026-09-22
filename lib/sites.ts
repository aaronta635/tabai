function stripSlash(url: string) {
  return url.replace(/\/$/, "");
}

function hostFromOrigin(origin: string) {
  try {
    return new URL(origin).host;
  } catch {
    return "";
  }
}

export function productOrigin() {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return value ? stripSlash(value) : "";
}

export function marketingOrigin() {
  const value = process.env.NEXT_PUBLIC_MARKETING_URL?.trim();
  if (value) return stripSlash(value);
  return productOrigin();
}

export function sitesAreSplit() {
  const app = productOrigin();
  const marketing = marketingOrigin();
  return Boolean(app && marketing && hostFromOrigin(app) !== hostFromOrigin(marketing));
}

function hostsFor(origin: string) {
  const host = hostFromOrigin(origin);
  if (!host) return [];
  const bare = host.replace(/^www\./, "");
  return [...new Set([host, bare, `www.${bare}`])];
}

export function isMarketingHost(host: string) {
  if (!sitesAreSplit()) return false;
  return hostsFor(marketingOrigin()).includes(host);
}

export function isProductHost(host: string) {
  if (!sitesAreSplit()) return false;
  return hostsFor(productOrigin()).includes(host);
}

const PRODUCT_PREFIXES = ["/teacher", "/student", "/onboarding", "/auth", "/l/", "/c/", "/s/", "/admin", "/t/", "/api/"];
const SHARED_API = ["/api/locale", "/api/health"];

export function isProductPath(pathname: string) {
  if (SHARED_API.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return false;
  }
  return PRODUCT_PREFIXES.some((prefix) => pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix));
}
