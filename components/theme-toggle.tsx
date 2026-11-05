"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function ThemeToggle({
  theme,
  labels,
  className = "",
}: {
  theme: "light" | "dark";
  labels: { on: string; off: string };
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [current, setCurrent] = useState(theme);
  const dark = current === "dark";
  const label = dark ? labels.off : labels.on;

  useEffect(() => {
    setCurrent(theme);
  }, [theme]);

  function setTheme(next: "light" | "dark") {
    if (next === current || pending) return;
    setCurrent(next);
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
    <button
      type="button"
      disabled={pending}
      aria-pressed={dark}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={`theme-toggle font-ui ${className}`}
    >
      {label}
    </button>
  );
}
