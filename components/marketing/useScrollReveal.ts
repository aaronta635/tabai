"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Callback ref. When the element enters the viewport it sets data-revealed="true" on itself
 * and every descendant; the CSS module does the animation. Reduced motion reveals at once.
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>() {
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => () => observer.current?.disconnect(), []);

  return useCallback((node: T | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!node) return;

    const reveal = () => {
      node.setAttribute("data-revealed", "true");
      node.querySelectorAll<HTMLElement>("*").forEach((child) => child.setAttribute("data-revealed", "true"));
    };

    if (matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }

    const next = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          reveal();
          next.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    next.observe(node);
    observer.current = next;
  }, []);
}
