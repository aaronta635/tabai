"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authHref, bindLocalSession, oauthReturn, startSocial, type Social } from "@/components/auth/auth-client";
import { RolePicker, SocialRow } from "@/components/auth/auth-parts";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { AccountRole } from "@/lib/onboarding";

export function LoginForm({
  next,
  initialRole,
  labels,
  initialError,
}: {
  next: string;
  initialRole: AccountRole;
  labels: {
    welcome: string;
    welcomeSub: string;
    iAm: string;
    teacher: string;
    student: string;
    email: string;
    password: string;
    signInAs: string;
    wrongRoleTutor: string;
    wrongRoleStudent: string;
    google: string;
    facebook: string;
    zalo: string;
    orWithEmail: string;
    forgot: string;
    forgotNeedEmail: string;
    resetSent: string;
    newHere: string;
    createLink: string;
    providerFailed: string;
  };
  initialError?: string | null;
}) {
  const router = useRouter();
  const role = initialRole;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const roleName = role === "tutor" ? labels.teacher : labels.student;

  async function onSocial(provider: Social) {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await startSocial(provider, role, next);
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
    const emailValue = String(data.get("email") ?? "").trim();
    const passwordValue = String(data.get("password") ?? "");
    const supabase = createBrowserSupabase();
    try {
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: emailValue,
        password: passwordValue,
      });
      if (signError) throw signError;
      const dest = await bindLocalSession({
        role,
        next,
        wrongRoleTutor: labels.wrongRoleTutor,
        wrongRoleStudent: labels.wrongRoleStudent,
      });
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "auth failed");
    } finally {
      setBusy(false);
    }
  }

  async function onForgot() {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError(labels.forgotNeedEmail);
      return;
    }
    setBusy(true);
    const supabase = createBrowserSupabase();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: oauthReturn(role, next),
    });
    setBusy(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setInfo(labels.resetSent);
  }

  return (
    <div className="auth-form">
      <h1>{labels.welcome}</h1>
      <p className="auth-lead">{labels.welcomeSub}</p>
      <RolePicker
        kind="login"
        role={role}
        next={next}
        label={labels.iAm}
        teacher={labels.teacher}
        student={labels.student}
      />
      <SocialRow busy={busy} labels={labels} onPick={(provider) => void onSocial(provider)} />
      <p className="auth-or">{labels.orWithEmail}</p>
      <form onSubmit={onSubmit} className="auth-fields">
        <input
          required
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder={labels.email}
          aria-label={labels.email}
          className="auth-field"
          suppressHydrationWarning
        />
        <input
          required
          type="password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          autoComplete="current-password"
          placeholder={labels.password}
          aria-label={labels.password}
          className="auth-field"
          suppressHydrationWarning
        />
        <button type="button" className="auth-forgot" onClick={() => void onForgot()} disabled={busy}>
          {labels.forgot}
        </button>
        {error ? <p className="auth-note auth-note-danger">{error}</p> : null}
        {info ? <p className="auth-note">{info}</p> : null}
        <button type="submit" disabled={busy} className="auth-submit">
          {busy ? "…" : labels.signInAs.replace("{role}", roleName)}
        </button>
      </form>
      <p className="auth-switch">
        {labels.newHere} <Link href={authHref("signup", role, next)}>{labels.createLink}</Link>
      </p>
    </div>
  );
}
