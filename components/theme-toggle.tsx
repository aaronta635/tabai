"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ThemeToggle({
  theme,
  labels,
  className = "",
}: {
  theme: "light" | "dark";
  labels: { light: string; dark: string };
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function setTheme(next: "light" | "dark") {
    if (next === theme) return;
    start(async () => {
      document.documentElement.dataset.theme = next;
      await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: next }),
      });
      router.refresh();
    });
  }

  return (
    <div
      className={`theme-toggle font-ui inline-flex rounded-full text-xs font-medium ${className}`}
      role="group"
      aria-label={theme === "dark" ? labels.light : labels.dark}
    >
      <button
        type="button"
        disabled={pending}
        aria-pressed={theme === "light"}
        onClick={() => setTheme("light")}
        className={`theme-toggle-btn rounded-l-full px-2.5 py-2 ${theme === "light" ? "theme-toggle-active" : "theme-toggle-idle"}`}
        title={labels.light}
      >
        <span aria-hidden>☀</span>
        <span className="sr-only">{labels.light}</span>
      </button>
      <button
        type="button"
        disabled={pending}
        aria-pressed={theme === "dark"}
        onClick={() => setTheme("dark")}
        className={`theme-toggle-btn rounded-r-full px-2.5 py-2 ${theme === "dark" ? "theme-toggle-active" : "theme-toggle-idle"}`}
        title={labels.dark}
      >
        <span aria-hidden>☾</span>
        <span className="sr-only">{labels.dark}</span>
      </button>
    </div>
  );
}
