"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LocaleToggle({
  locale,
  className = "",
}: {
  locale: string;
  className?: string;
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

  return (
    <div className={`inline-flex overflow-hidden rounded-full bg-white text-xs font-medium ${className}`}>
      <button
        type="button"
        disabled={pending}
        onClick={() => setLocale("vi")}
        className={`px-3 py-2 ${locale === "vi" ? "bg-[#141210] text-white" : "text-[#141210]"}`}
      >
        VI
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setLocale("en")}
        className={`px-3 py-2 ${locale === "en" ? "bg-[#141210] text-white" : "text-[#141210]"}`}
      >
        EN
      </button>
    </div>
  );
}
