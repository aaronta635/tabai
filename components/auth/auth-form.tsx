"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function AuthForm({
  next,
  labels,
}: {
  next: string;
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

    try {
      if (mode === "signup") {
        const { error: signError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (signError) throw signError;
        setInfo(labels.checkEmail);
      } else {
        const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
        if (signError) throw signError;
        router.push(next);
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
          className="mt-1 w-full rounded-full border border-[#141210]/10 bg-white px-4 py-3"
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
          className="mt-1 w-full rounded-full border border-[#141210]/10 bg-white px-4 py-3"
        />
      </label>
      {error ? <p className="text-sm text-[#b42318]">{error}</p> : null}
      {info ? <p className="text-sm text-[#6b6560]">{info}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-[#141210] py-3 text-white disabled:opacity-60"
      >
        {busy ? "…" : mode === "signup" ? labels.signUp : labels.signIn}
      </button>
      <button
        type="button"
        className="w-full text-sm text-[#6b6560]"
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
