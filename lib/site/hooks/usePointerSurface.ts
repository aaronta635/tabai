"use client";

import { useEffect, type RefObject } from "react";

/** Demand-driven pointer coordinates. CSS owns presentation; no idle rAF loop. */
export function usePointerSurface(
  ref: RefObject<HTMLElement | null>,
  enabled = true,
) {
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let frame = 0;
    let x = 0;
    let y = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      element.dataset.pointerActive = "false";
      element.style.setProperty("--surface-nx", "0");
      element.style.setProperty("--surface-ny", "0");
      element.style.removeProperty("--surface-x");
      element.style.removeProperty("--surface-y");
    };
    const allowed = () =>
      visible && fine.matches && !reduced.matches && !document.hidden;
    const paint = () => {
      frame = 0;
      if (!allowed()) return reset();
      const rect = element.getBoundingClientRect();
      const px = Math.max(0, Math.min(rect.width, x - rect.left));
      const py = Math.max(0, Math.min(rect.height, y - rect.top));
      element.style.setProperty("--surface-x", `${px.toFixed(1)}px`);
      element.style.setProperty("--surface-y", `${py.toFixed(1)}px`);
      element.style.setProperty(
        "--surface-nx",
        (2 * (px / Math.max(rect.width, 1)) - 1).toFixed(4),
      );
      element.style.setProperty(
        "--surface-ny",
        (2 * (py / Math.max(rect.height, 1)) - 1).toFixed(4),
      );
      element.dataset.pointerActive = "true";
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !allowed()) return;
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) reset();
    });
    observer.observe(element);
    element.addEventListener("pointermove", move, { passive: true });
    element.addEventListener("pointerleave", reset);
    element.addEventListener("pointercancel", reset);
    window.addEventListener("scroll", reset, { passive: true });
    window.addEventListener("resize", reset, { passive: true });
    document.addEventListener("visibilitychange", reset);
    fine.addEventListener("change", reset);
    reduced.addEventListener("change", reset);
    return () => {
      reset();
      observer.disconnect();
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
      element.removeEventListener("pointercancel", reset);
      window.removeEventListener("scroll", reset);
      window.removeEventListener("resize", reset);
      document.removeEventListener("visibilitychange", reset);
      fine.removeEventListener("change", reset);
      reduced.removeEventListener("change", reset);
    };
  }, [ref, enabled]);
}
