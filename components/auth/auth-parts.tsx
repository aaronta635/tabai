"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { AccountRole } from "@/lib/onboarding";
import { authHref, type Social } from "@/components/auth/auth-client";

export function RolePicker({
  kind,
  role,
  next,
  label,
  teacher,
  student,
}: {
  kind: "login" | "signup";
  role: AccountRole;
  next: string;
  label: string;
  teacher: string;
  student: string;
}) {
  return (
    <>
      <p className="auth-iam">{label}</p>
      <div className="auth-roles" role="group" aria-label={label}>
        {(["tutor", "student"] as const).map((option) => (
          <Link
            key={option}
            href={authHref(kind, option, next)}
            aria-current={role === option ? "true" : undefined}
          >
            {option === "tutor" ? teacher : student}
          </Link>
        ))}
      </div>
    </>
  );
}

export function SocialRow({
  busy,
  labels,
  onPick,
}: {
  busy: boolean;
  labels: { google: string; facebook: string; zalo: string };
  onPick: (provider: Social) => void;
}) {
  const social: { id: Social; label: string; mark: ReactNode }[] = [
    { id: "google", label: labels.google, mark: <GoogleMark /> },
    { id: "facebook", label: labels.facebook, mark: <FacebookMark /> },
    { id: "zalo", label: labels.zalo, mark: <ZaloMark /> },
  ];
  return (
    <div className="auth-social">
      {social.map((row) => (
        <button key={row.id} type="button" disabled={busy} onClick={() => onPick(row.id)}>
          {row.mark}
          <span>{row.label}</span>
        </button>
      ))}
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
