"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { authHref, bindLocalSession, enterStudio, oauthReturn, startSocial, type Social } from "@/components/auth/auth-client";
import { RolePicker, SocialRow } from "@/components/auth/auth-parts";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { AccountRole } from "@/lib/onboarding";

export function SignupForm({
  next,
  initialRole,
  labels,
  initialError,
}: {
  next: string;
  initialRole: AccountRole;
  labels: {
    createTitle: string;
    createSub: string;
    iAm: string;
    teacher: string;
    student: string;
    email: string;
    password: string;
    confirmPassword: string;
    passwordMismatch: string;
    signUpAs: string;
    checkEmail: string;
    wrongRoleTutor: string;
    wrongRoleStudent: string;
    google: string;
    facebook: string;
    zalo: string;
    orWithEmail: string;
    haveAccount: string;
    signInLink: string;
    providerFailed: string;
  };
  initialError?: string | null;
}) {
  const role = initialRole;
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
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");
    if (password !== confirm) {
      setError(labels.passwordMismatch);
      setBusy(false);
      return;
    }
    const supabase = createBrowserSupabase();
    try {
      const { error: signError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
          emailRedirectTo: oauthReturn(role, next),
        },
      });
      if (signError) throw signError;
      setInfo(labels.checkEmail);
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const dest = await bindLocalSession({
          role,
          next,
          wrongRoleTutor: labels.wrongRoleTutor,
          wrongRoleStudent: labels.wrongRoleStudent,
        });
        enterStudio(dest);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "auth failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-form">
      <h1>{labels.createTitle}</h1>
      <p className="auth-lead">{labels.createSub}</p>
      <RolePicker
        kind="signup"
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
          minLength={6}
          autoComplete="new-password"
          placeholder={labels.password}
          aria-label={labels.password}
          className="auth-field"
          suppressHydrationWarning
        />
        <input
          required
          type="password"
          name="confirm"
          minLength={6}
          autoComplete="new-password"
          placeholder={labels.confirmPassword}
          aria-label={labels.confirmPassword}
          className="auth-field"
          suppressHydrationWarning
        />
        {error ? <p className="auth-note auth-note-danger">{error}</p> : null}
        {info ? <p className="auth-note">{info}</p> : null}
        <button type="submit" disabled={busy} className="auth-submit">
          {busy ? "…" : labels.signUpAs.replace("{role}", roleName)}
        </button>
      </form>
      <p className="auth-switch">
        {labels.haveAccount} <Link href={authHref("login", role, next)}>{labels.signInLink}</Link>
      </p>
    </div>
  );
}
