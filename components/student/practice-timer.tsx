"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export function PracticeTimer({ code }: { code: string }) {
  const t = useTranslations("student");
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<string | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  async function stop() {
    setRunning(false);
    const elapsed = seconds;
    if (elapsed < 15) {
      setError(t("practiceTooShort"));
      setSeconds(0);
      startedAt.current = null;
      return;
    }
    setError(null);
    const res = await fetch(`/api/l/${code}/practice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seconds: elapsed, startedAt: startedAt.current }),
    });
    if (!res.ok) {
      setError(t("practiceFailed"));
      return;
    }
    setSaved(t("practiceSaved").replace("{minutes}", String(Math.max(1, Math.round(elapsed / 60)))));
    setSeconds(0);
    startedAt.current = null;
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="rounded-2xl bg-cream px-4 py-3">
      <p className="font-display text-2xl tabular-nums">
        {mm}:{ss}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {running ? (
          <button type="button" className="btn" onClick={() => void stop()}>
            {t("stopPractice")}
          </button>
        ) : (
          <button
            type="button"
            className="btn"
            onClick={() => {
              setSaved(null);
              setError(null);
              setSeconds(0);
              startedAt.current = new Date().toISOString();
              setRunning(true);
            }}
          >
            {t("startPractice")}
          </button>
        )}
      </div>
      {saved ? <p className="mt-2 text-sm text-ink-soft">{saved}</p> : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
