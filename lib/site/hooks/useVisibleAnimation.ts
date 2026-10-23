"use client";

import { useEffect, type RefObject } from "react";

/** Pause CSS motion outside the viewport or when the document is inactive. */
export function useVisibleAnimation(
  ref: RefObject<HTMLElement | null>,
  paused = false,
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let visible = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      element.dataset.playing = String(
        visible && !document.hidden && !reduced.matches && !paused,
      );
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.2 },
    );
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [ref, paused]);
}
