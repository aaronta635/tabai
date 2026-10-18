import type { AccountRole } from "@/lib/onboarding";

export const RETURN_PATH_HEADER = "x-howl0-path";

const STUDIO: Record<AccountRole, string> = {
  tutor: "/teacher",
  student: "/student",
};

function rawPath(value: string) {
  const cut = value.split("#")[0] ?? "";
  const query = cut.indexOf("?");
  return query === -1 ? cut : cut.slice(0, query);
}

function rejected(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return true;
  if (value.includes("\\") || value.includes("@") || value.includes("\0")) return true;
  const lower = value.toLowerCase();
  return lower.includes("%5c") || lower.includes("%2f") || lower.includes("%00");
}

function sameOriginPath(value: string) {
  if (rejected(value)) return null;
  let url: URL;
  try {
    url = new URL(value, "http://howl0.local");
  } catch {
    return null;
  }
  if (url.origin !== "http://howl0.local") return null;
  if (url.username || url.password) return null;
  return url;
}

function under(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Studio page, class-join code, or a single teacher invite. Nothing else. */
export function safeReturn(role: AccountRole, path: string | null | undefined): string | null {
  if (!path) return null;
  const url = sameOriginPath(path);
  if (!url) return null;
  const pathname = url.pathname;
  if (pathname === "/auth" || pathname.startsWith("/auth/")) return null;
  if (pathname === "/login" || pathname.startsWith("/login/")) return null;
  if (pathname === "/signup" || pathname.startsWith("/signup/")) return null;
  if (under(pathname, STUDIO[role])) return `${pathname}${url.search}`;
  if (role === "student" && /^\/(?:join|c)\/[a-z0-9]{4,32}$/.test(pathname)) return pathname;
  if (role === "tutor" && /^\/t\/[A-Za-z0-9_-]{16,64}$/.test(pathname)) return pathname;
  return null;
}

/** Where onboarding may send someone. Invite and class links are not studio pages. */
export function studioReturn(role: AccountRole, path: string | null | undefined): string | null {
  const safe = safeReturn(role, path);
  if (!safe) return null;
  const pathname = rawPath(safe);
  return under(pathname, STUDIO[role]) ? safe : null;
}

export function inviteTokenFromReturn(path: string | null | undefined): string | null {
  const safe = safeReturn("tutor", path);
  if (!safe) return null;
  const match = /^\/t\/([A-Za-z0-9_-]{16,64})$/.exec(safe);
  return match?.[1] ?? null;
}

export function authRoleSegment(role: AccountRole) {
  return role === "tutor" ? "teacher" : "student";
}

export function parseAuthSegment(value: string | null | undefined): AccountRole | null {
  if (value === "teacher" || value === "tutor") return "tutor";
  if (value === "student") return "student";
  return null;
}

/** `/login/student`, or with `next` only when it is a real page past the studio home. */
export function authPath(kind: "login" | "signup", role: AccountRole, path?: string | null) {
  const base = `/${kind}/${authRoleSegment(role)}`;
  const safe = safeReturn(role, path);
  if (!safe || safe === STUDIO[role]) return base;
  return `${base}?next=${encodeURIComponent(safe)}`;
}

export function signInPath(role: AccountRole, path?: string | null): string {
  return authPath("login", role, path);
}

export function destinationAfterAuth(input: {
  role: AccountRole;
  onboarded: boolean;
  requested: string | null | undefined;
  home: string;
}): string {
  const safe = safeReturn(input.role, input.requested);
  const landing = safe && !safe.startsWith("/t/") ? safe : null;
  if (!input.onboarded) {
    const studio = studioReturn(input.role, input.requested);
    return studio ? `/onboarding?next=${encodeURIComponent(studio)}` : "/onboarding";
  }
  return landing ?? input.home;
}
