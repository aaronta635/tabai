import { createBrowserSupabase } from "@/lib/supabase/client";
import { resolveAppOrigin } from "@/lib/app-origin";
import type { AccountRole } from "@/lib/onboarding";
import { authPath } from "@/lib/return-path";

export type Social = "google" | "facebook" | "zalo";

export function oauthReturn(role: AccountRole, next: string) {
  const params = new URLSearchParams();
  params.set("role", role);
  if (next) params.set("next", next);
  return `${resolveAppOrigin(window.location.origin)}/auth/callback?${params}`;
}

export function authHref(path: "login" | "signup", role: AccountRole, next: string) {
  return authPath(path, role, next);
}

export async function bindLocalSession(input: {
  role: AccountRole;
  next: string;
  wrongRoleTutor: string;
  wrongRoleStudent: string;
}) {
  const supabase = createBrowserSupabase();
  const sessionRes = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: input.role, next: input.next }),
  });
  const json = (await sessionRes.json()) as {
    next?: string;
    error?: string;
    actual?: string;
  };
  if (!sessionRes.ok) {
    if (json.error === "role_mismatch") {
      await supabase.auth.signOut();
      throw new Error(json.actual === "tutor" ? input.wrongRoleTutor : input.wrongRoleStudent);
    }
    throw new Error(json.error ?? "session failed");
  }
  return json.next ?? input.next;
}

/** Full load so a previous student's cached studio page cannot paint after account switch. */
export function enterStudio(dest: string) {
  window.location.assign(dest);
}

export async function startSocial(provider: Social, role: AccountRole, next: string) {
  const supabase = createBrowserSupabase();
  const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
    provider: provider === "zalo" ? ("custom:zalo" as "google") : provider,
    options: { redirectTo: oauthReturn(role, next), skipBrowserRedirect: true },
  });
  if (oauthError || !data?.url) throw oauthError ?? new Error("missing");
  const probe = await fetch("/api/auth/provider", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: data.url }),
  });
  if (!probe.ok) throw new Error("provider");
  window.location.assign(data.url);
}
