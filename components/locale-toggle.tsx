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

  const shell = tone === "dark" ? "bg-white/10 text-[#fff7f2]" : "bg-white text-[#35242d]";
  const active = tone === "dark" ? "bg-white text-[#35242d]" : "bg-[#35242d] text-white";
  const idle = tone === "dark" ? "text-[#fff7f2]" : "text-[#35242d]";

  return (
    <div className={`inline-flex rounded-full text-xs font-medium ${shell} ${className}`}>
      <button
        type="button"
        disabled={pending}
        onClick={() => setLocale("vi")}
        className={`rounded-l-full px-3 py-2 ${locale === "vi" ? active : idle}`}
      >
        VI
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setLocale("en")}
        className={`rounded-r-full px-3 py-2 ${locale === "en" ? active : idle}`}
      >
        EN
      </button>
    </div>
  );
}
