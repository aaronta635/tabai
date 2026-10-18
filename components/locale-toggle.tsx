"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LocaleToggle({
  locale,
  className = "",
  tone = "light",
}: {
  locale: string;
  className?: string;
  tone?: "light" | "dark";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function setLocale(next: "vi" | "en") {
    start(async () => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      router.refresh();
    });
  }

  const toneClass = tone === "dark" ? "locale-toggle-on-dark" : "";

  return (
    <div className={`locale-toggle inline-flex rounded-full text-xs font-medium ${toneClass} ${className}`}>
      <button
        type="button"
        disabled={pending}
        onClick={() => setLocale("vi")}
        className={`locale-toggle-btn rounded-l-full px-3 py-2 ${locale === "vi" ? "locale-toggle-active" : "locale-toggle-idle"}`}
      >
        VI
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setLocale("en")}
        className={`locale-toggle-btn rounded-r-full px-3 py-2 ${locale === "en" ? "locale-toggle-active" : "locale-toggle-idle"}`}
      >
        EN
      </button>
    </div>
  );
}
