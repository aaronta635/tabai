"use client";

import { useEffect, useState } from "react";
import { serviceWaitElapsedMs } from "@/lib/service-wait";

/** Tick once when a service wait runs out so spinners can stop without polling. */
export function useServiceWaitClock(active: boolean, startedAt: Date | string | null | undefined, waitMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
  }, [active, startedAt, waitMs]);
  useEffect(() => {
    if (!active || startedAt == null) return;
    const remaining = waitMs - serviceWaitElapsedMs(startedAt);
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setNow(Date.now()), remaining);
    return () => window.clearTimeout(timer);
  }, [active, startedAt, waitMs]);
  return now;
}
