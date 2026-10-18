export const PRODUCTION_APP_ORIGIN = "https://paramuzic.com";

export function stripOriginSlash(value: string) {
  return value.replace(/\/$/, "");
}

export function isLocalhostOrigin(value: string) {
  try {
    const { hostname } = new URL(value);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return /localhost|127\.0\.0\.1/.test(value);
  }
}

/**
 * Never let a localhost env URL override the host the user actually hit.
 * Production with a missing/localhost env falls back to paramuzic.com.
 */
export function resolveAppOrigin(requestOrigin?: string | null) {
  const env = stripOriginSlash(process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "");
  const incoming = requestOrigin ? stripOriginSlash(requestOrigin) : "";
  if (incoming && !isLocalhostOrigin(incoming)) return incoming;
  if (env && !isLocalhostOrigin(env)) return env;
  if (process.env.VERCEL || process.env.NODE_ENV === "production") return PRODUCTION_APP_ORIGIN;
  return incoming || env || "http://localhost:3000";
}

export function originFromRequest(request: {
  nextUrl: { origin: string };
  headers: { get(name: string): string | null };
}) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    const proto = forwardedProto ?? (isLocalhostOrigin(`http://${forwardedHost}`) ? "http" : "https");
    return resolveAppOrigin(`${proto}://${forwardedHost.split(",")[0]!.trim()}`);
  }
  return resolveAppOrigin(request.nextUrl.origin);
}
