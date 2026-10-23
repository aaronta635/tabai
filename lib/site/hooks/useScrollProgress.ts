"use client";
import { useEffect, type RefObject } from "react";

type Mode = "pin" | "enter";
type Options = {
  enabled?: boolean;
  mode?: Mode;
  stages?: number;
  onProgress?: (progress: number) => void;
  settleMs?: number;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Writes progress to the element without causing a React render on scroll. */
export function useScrollProgress<T extends HTMLElement>(
  ref: RefObject<T | null>,
  {
    enabled = true,
    mode = "enter",
    stages,
    onProgress,
    settleMs = 0,
  }: Options = {},
) {
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastStage = -1;
    let active = true;
    let disposed = false;
    let settled: number | null = null;
    let lastTime = 0;
    const measure = (time: number) => {
      frame = 0;
      if (!active || document.hidden) return;
      if (reduced.matches) {
        settled = null;
        element.style.setProperty("--scene-progress", "1");
        element.style.setProperty("--scene-enter", "1");
        element.style.setProperty("--scene-exit", "0");
        if (stages) element.dataset.stage = String(stages - 1);
        onProgress?.(1);
        return;
      }
      const rect = element.getBoundingClientRect();
      const height = window.innerHeight;
      element.style.setProperty(
        "--scene-enter",
        clamp((height - rect.top) / (height * 0.65)).toFixed(4),
      );
      element.style.setProperty(
        "--scene-exit",
        clamp(-rect.top / Math.max(1, rect.height * 0.75)).toFixed(4),
      );
      element.dataset.sceneVisible = String(
        rect.top < height * 0.85 && rect.bottom > 0,
      );
      const target =
        mode === "pin"
          ? clamp(-rect.top / Math.max(1, rect.height - height))
          : clamp((height - rect.top) / (height + rect.height));
      // Settle artwork only, never the document scroll position. Headlines and
      // visual stages receive this same value. Large anchor jumps snap directly.
      if (settled === null || !settleMs || Math.abs(target - settled) > 0.4) {
        settled = target;
      } else {
        const delta = Math.min(64, Math.max(1, time - lastTime || 16.67));
        settled += (target - settled) * (1 - Math.exp(-delta / settleMs));
        if (Math.abs(target - settled) < 0.0001) settled = target;
      }
      lastTime = time;
      const progress = settled;
      element.style.setProperty("--scene-progress", progress.toFixed(4));
      if (stages) {
        const stage = Math.min(stages - 1, Math.floor(progress * stages));
        if (stage !== lastStage) {
          element.dataset.stage = String(stage);
          lastStage = stage;
        }
      }
      onProgress?.(progress);
      if (settled !== target) frame = requestAnimationFrame(measure);
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting;
        if (!active) settled = null;
        if (active) request();
      },
      { rootMargin: "25% 0px" },
    );
    observer.observe(element);
    const onMotion = () => {
      if (disposed) return;
      active = true;
      settled = null;
      lastTime = 0;
      request();
    };
    const resizeObserver = new ResizeObserver(onMotion);
    resizeObserver.observe(element);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", onMotion, { passive: true });
    window.addEventListener("pageshow", onMotion);
    window.addEventListener("orientationchange", onMotion);
    window.visualViewport?.addEventListener("resize", onMotion);
    document.fonts.ready.then(onMotion).catch(() => {});
    document.addEventListener("visibilitychange", onMotion);
    reduced.addEventListener("change", onMotion);
    request();
    return () => {
      disposed = true;
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onMotion);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", onMotion);
      window.removeEventListener("pageshow", onMotion);
      window.removeEventListener("orientationchange", onMotion);
      window.visualViewport?.removeEventListener("resize", onMotion);
      reduced.removeEventListener("change", onMotion);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref, enabled, mode, stages, onProgress, settleMs]);
}
