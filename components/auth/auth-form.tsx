"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { AccountRole } from "@/lib/onboarding";

export function AuthForm({
  next,
  role,
  labels,
}: {
  next: string;
  role: AccountRole;
  labels: {
    email: string;
    password: string;
    signIn: string;
    signUp: string;
    checkEmail: string;
  };
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const supabase = createBrowserSupabase();
    const after = `/onboarding`;
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(after)}&role=${role}`;

    try {
      if (mode === "signup") {
        const { error: signError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role },
            emailRedirectTo: redirectTo,
          },
        });
        if (signError) throw signError;
        setInfo(labels.checkEmail);
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          const sessionRes = await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role }),
          });
          const json = (await sessionRes.json()) as { next?: string };
          router.push(json.next ?? after);
          router.refresh();
        }
      } else {
        const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
        if (signError) throw signError;
        const sessionRes = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        const json = (await sessionRes.json()) as { next?: string; error?: string };
        if (!sessionRes.ok) throw new Error(json.error ?? "session failed");
        router.push(json.next ?? next);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "auth failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        {labels.email}
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          className="mt-1 w-full rounded-full border border-ink/10 bg-white px-4 py-3"
        />
      </label>
      <label className="block text-sm">
        {labels.password}
        <input
          required
          type="password"
          name="password"
          minLength={6}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="mt-1 w-full rounded-full border border-ink/10 bg-white px-4 py-3"
        />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {info ? <p className="text-sm text-ink-soft">{info}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-beat py-3 text-white disabled:opacity-60"
      >
        {busy ? "…" : mode === "signup" ? labels.signUp : labels.signIn}
      </button>
      <button
        type="button"
        className="w-full text-sm text-ink-soft"
        onClick={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setError(null);
          setInfo(null);
        }}
      >
        {mode === "signup" ? labels.signIn : labels.signUp}
      </button>
    </form>
  );
}
