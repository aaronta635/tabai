"use client";

import { useEffect, useState, type ReactNode } from "react";
import { authHref } from "@/components/auth/auth-client";
import type { AccountRole } from "@/lib/onboarding";

const ENTERED = "para-auth-entered";

type Phase = "boot" | "door" | "leaving" | "form";

export function AuthEntrance({
  kind,
  role,
  next,
  labels,
  children,
}: {
  kind: "login" | "signup";
  role: AccountRole;
  next: string;
  labels: {
    eyebrow: string;
    prompt: string;
    student: string;
    teacher: string;
    hint: string;
  };
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>("boot");

  useEffect(() => {
    let stored = false;
    try {
      stored = sessionStorage.getItem(ENTERED) === "1";
    } catch {
      stored = false;
    }
    setPhase(stored ? "form" : "door");
  }, []);

  useEffect(() => {
    if (phase !== "leaving") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setPhase("form"), reduced ? 0 : 620);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function enter(picked: AccountRole) {
    try {
      sessionStorage.setItem(ENTERED, "1");
    } catch {
      // The form still opens when storage is blocked.
    }
    if (picked !== role) {
      window.location.assign(authHref(kind, picked, next));
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPhase(reduced ? "form" : "leaving");
  }

  if (phase === "boot") {
    return <div className="auth-door auth-door-boot" aria-hidden="true" />;
  }

  if (phase === "form") {
    return <div className="auth-arrive">{children}</div>;
  }

  const leaving = phase === "leaving";

  return (
    <div className={leaving ? "auth-door is-leaving" : "auth-door"}>
      <p className="auth-door-kicker">{labels.eyebrow}</p>
      <h1 className="auth-door-prompt">{labels.prompt}</h1>
      <p className="auth-door-hint">{labels.hint}</p>
      <button
        type="button"
        className={leaving ? "auth-fret is-leaving" : "auth-fret"}
        onClick={() => enter("student")}
        disabled={leaving}
      >
        <span className="auth-fret-strings" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </span>
        <span className="auth-fret-label">{labels.student}</span>
      </button>
      <button type="button" className="auth-door-teacher" onClick={() => enter("tutor")} disabled={leaving}>
        {labels.teacher}
      </button>
    </div>
  );
}
