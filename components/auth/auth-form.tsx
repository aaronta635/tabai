"use client";

import { FormEvent, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { AccountRole } from "@/lib/onboarding";

type Social = "google" | "facebook" | "zalo";

export function AuthForm({
  next,
  role,
  labels,
  initialError,
}: {
  next: string;
  role: AccountRole;
  labels: {
    email: string;
    password: string;
    signIn: string;
    signUp: string;
    checkEmail: string;
    wrongRoleTutor: string;
    wrongRoleStudent: string;
    continueGoogle: string;
    continueFacebook: string;
    continueZalo: string;
    orEmail: string;
    providerFailed: string;
  };
  initialError?: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function redirectTo() {
    const after = "/onboarding";
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(after)}&role=${role}`;
  }

  async function bindLocalSession(
    supabase: ReturnType<typeof createBrowserSupabase>,
  ): Promise<string> {
    const sessionRes = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const json = (await sessionRes.json()) as {
      next?: string;
      error?: string;
      actual?: string;
    };
    if (!sessionRes.ok) {
      if (json.error === "role_mismatch") {
        await supabase.auth.signOut();
        throw new Error(json.actual === "tutor" ? labels.wrongRoleTutor : labels.wrongRoleStudent);
      }
      throw new Error(json.error ?? "session failed");
    }
    return json.next ?? next;
  }

  async function onSocial(provider: Social) {
    setError(null);
    setInfo(null);
    setBusy(true);
    const supabase = createBrowserSupabase();
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: provider === "zalo" ? ("custom:zalo" as "google") : provider,
        options: { redirectTo: redirectTo(), skipBrowserRedirect: true },
      });
      if (oauthError || !data?.url) throw oauthError ?? new Error("missing");
      const probe = await fetch("/api/auth/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: data.url }),
      });
      if (!probe.ok) throw new Error("provider");
      window.location.assign(data.url);
    } catch {
      setError(labels.providerFailed);
      setBusy(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const supabase = createBrowserSupabase();

    try {
      if (mode === "signup") {
        const { error: signError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role },
            emailRedirectTo: redirectTo(),
          },
        });
        if (signError) throw signError;
        setInfo(labels.checkEmail);
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          const dest = await bindLocalSession(supabase);
          router.push(dest);
          router.refresh();
        }
      } else {
        const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
        if (signError) throw signError;
        const dest = await bindLocalSession(supabase);
        router.push(dest);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "auth failed");
    } finally {
      setBusy(false);
    }
  }

  const social: { id: Social; label: string; mark: ReactNode }[] = [
    { id: "google", label: labels.continueGoogle, mark: <GoogleMark /> },
    { id: "facebook", label: labels.continueFacebook, mark: <FacebookMark /> },
    { id: "zalo", label: labels.continueZalo, mark: <ZaloMark /> },
  ];

  return (
    <div className="auth-stack">
      {social.map((row) => (
        <button
          key={row.id}
          type="button"
          className="auth-bar"
          disabled={busy}
          onClick={() => onSocial(row.id)}
        >
          {row.mark}
          <span>{row.label}</span>
        </button>
      ))}
      <p className="auth-or">{labels.orEmail}</p>
      <form onSubmit={onSubmit} className="auth-stack">
        <label className="auth-bar">
          <span className="auth-kicker">{labels.email}</span>
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            className="auth-input"
          />
        </label>
        <label className="auth-bar">
          <span className="auth-kicker">{labels.password}</span>
          <input
            required
            type="password"
            name="password"
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="auth-input"
          />
        </label>
        {error ? <p className="auth-note auth-note-danger">{error}</p> : null}
        {info ? <p className="auth-note">{info}</p> : null}
        <button type="submit" disabled={busy} className="auth-bar auth-bar-fill">
          {busy ? "…" : mode === "signup" ? labels.signUp : labels.signIn}
        </button>
      </form>
      <button
        type="button"
        className="auth-switch"
        onClick={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setError(null);
          setInfo(null);
        }}
      >
        {mode === "signup" ? labels.signIn : labels.signUp}
      </button>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="auth-mark" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.4A7.2 7.2 0 0 1 5 12c0-.8.1-1.6.4-2.4V6.5H1.4A12 12 0 0 0 0 12c0 1.9.5 3.8 1.4 5.5l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.5l4 3.1C6.3 6.8 8.9 4.8 12 4.8z" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg className="auth-mark" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1C0 18.1 4.4 23 10.1 24v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.8v2.2h3.3l-.5 3.5h-2.8V24C19.6 23 24 18.1 24 12.1z"
      />
    </svg>
  );
}

function ZaloMark() {
  return (
    <svg className="auth-mark" viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#0068FF" />
      <path fill="#fff" d="M7.2 7.1h2.3l2.5 3.6 2.5-3.6h2.3L13.2 12l3.6 4.9h-2.3l-2.5-3.6-2.5 3.6H7.2L10.8 12 7.2 7.1z" />
    </svg>
  );
}
