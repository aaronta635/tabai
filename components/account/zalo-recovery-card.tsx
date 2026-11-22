"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { AccountRole } from "@/lib/onboarding";
import { oauthRedirectTo } from "@/lib/oauth-bind";
import {
  mapZaloRecoveryAuthError,
  needsZaloAccountRecovery,
  ZALO_RECOVERY_DISMISS_KEY,
  ZALO_RECOVERY_MIN_PASSWORD,
  type ZaloRecoveryErrorKey,
} from "@/lib/zalo-account-recovery";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { deliverableAddress } from "@/lib/deliverable-email";
import { API_WAIT_MS } from "@/lib/constants";
import { fetchWithServiceWait } from "@/lib/service-wait";

export type ZaloRecoveryLabels = {
  title: string;
  body: string;
  studentHint: string;
  email: string;
  password: string;
  confirmPassword: string;
  saveEmail: string;
  linkGoogle: string;
  or: string;
  dismiss: string;
  checkEmail: string;
  saved: string;
  errors: Record<ZaloRecoveryErrorKey, string>;
};

async function syncStudioEmail() {
  await fetchWithServiceWait("/api/account/recovery-sync", { method: "POST" }, API_WAIT_MS);
}

function authErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  return "";
}

export function ZaloRecoveryCard({
  role,
  showInitially,
  labels,
}: {
  role: "student" | "teacher";
  showInitially: boolean;
  labels: ZaloRecoveryLabels;
}) {
  const accountRole: AccountRole = role === "teacher" ? "tutor" : "student";
  const [visible, setVisible] = useState(showInitially);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const refreshNeeded = useCallback(async () => {
    try {
      const supabase = createBrowserSupabase();
      const { data } = await supabase.auth.getUser();
      if (!needsZaloAccountRecovery(data.user)) {
        if (deliverableAddress(data.user?.email)) await syncStudioEmail();
        setVisible(false);
        return false;
      }
      if (sessionStorage.getItem(ZALO_RECOVERY_DISMISS_KEY) === "1") {
        setVisible(false);
        return true;
      }
      setVisible(true);
      return true;
    } catch {
      return showInitially;
    }
  }, [showInitially]);

  useEffect(() => {
    if (!showInitially) {
      setVisible(false);
      return;
    }
    void refreshNeeded();
  }, [refreshNeeded, showInitially]);

  function dismiss() {
    sessionStorage.setItem(ZALO_RECOVERY_DISMISS_KEY, "1");
    setVisible(false);
  }

  function showError(key: ZaloRecoveryErrorKey) {
    setError(labels.errors[key]);
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
      showError("passwordMismatch");
      setBusy(false);
      return;
    }
    if (password.length < ZALO_RECOVERY_MIN_PASSWORD) {
      showError("weakPassword");
      setBusy(false);
      return;
    }
    const supabase = createBrowserSupabase();
    try {
      const redirectTo = oauthRedirectTo(window.location.origin, accountRole, window.location.pathname);
      const { data: updated, error: updateError } = await supabase.auth.updateUser(
        { email, password },
        { emailRedirectTo: redirectTo },
      );
      if (updateError) throw updateError;
      const confirmed = deliverableAddress(updated.user?.email)?.toLowerCase() === email.toLowerCase();
      if (confirmed) {
        await syncStudioEmail();
        setInfo(labels.saved);
        setVisible(false);
        return;
      }
      setInfo(labels.checkEmail);
    } catch (err) {
      showError(mapZaloRecoveryAuthError(authErrorMessage(err)));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setInfo(null);
    setBusy(true);
    const supabase = createBrowserSupabase();
    try {
      const { data, error: linkError } = await supabase.auth.linkIdentity({
        provider: "google",
        options: {
          redirectTo: oauthRedirectTo(window.location.origin, accountRole, window.location.pathname),
          skipBrowserRedirect: true,
          queryParams: { prompt: "select_account" },
        },
      });
      if (linkError) throw linkError;
      if (!data?.url) throw new Error("missing");
      window.location.assign(data.url);
    } catch (err) {
      showError(mapZaloRecoveryAuthError(authErrorMessage(err)));
      setBusy(false);
    }
  }

  if (!visible) return null;

  return (
    <section className="zalo-recovery-card side-card" aria-labelledby="zalo-recovery-title">
      <h2 id="zalo-recovery-title" className="side-card-title">
        {labels.title}
      </h2>
      <p>{labels.body}</p>
      {role === "student" ? <p className="zalo-recovery-hint">{labels.studentHint}</p> : null}
      {info ? <p className="zalo-recovery-info">{info}</p> : null}
      {error ? <p className="zalo-recovery-error" role="alert">{error}</p> : null}
      <form className="zalo-recovery-fields" onSubmit={onSubmit}>
        <label className="field-label" htmlFor="zalo-recovery-email">
          {labels.email}
        </label>
        <input
          id="zalo-recovery-email"
          required
          type="email"
          name="email"
          autoComplete="email"
          className="field"
          disabled={busy}
        />
        <label className="field-label" htmlFor="zalo-recovery-password">
          {labels.password}
        </label>
        <input
          id="zalo-recovery-password"
          required
          type="password"
          name="password"
          autoComplete="new-password"
          className="field"
          disabled={busy}
        />
        <label className="field-label" htmlFor="zalo-recovery-confirm">
          {labels.confirmPassword}
        </label>
        <input
          id="zalo-recovery-confirm"
          required
          type="password"
          name="confirm"
          autoComplete="new-password"
          className="field"
          disabled={busy}
        />
        <div className="zalo-recovery-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {labels.saveEmail}
          </button>
        </div>
      </form>
      <p className="zalo-recovery-or">{labels.or}</p>
      <button type="button" className="btn" disabled={busy} onClick={() => void onGoogle()}>
        {labels.linkGoogle}
      </button>
      <div className="zalo-recovery-actions zalo-recovery-actions-end">
        <button type="button" className="btn btn-quiet" disabled={busy} onClick={dismiss}>
          {labels.dismiss}
        </button>
      </div>
    </section>
  );
}