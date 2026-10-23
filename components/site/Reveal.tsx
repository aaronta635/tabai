"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Variant =
  "fade" | "fadeUp" | "fadeScale" | "maskReveal" | "staggerChildren";

/** Reveals once on entry. Server-rendered content remains visible before hydration. */
export function Reveal({
  className = "",
  variant = "fadeUp",
  children,
}: {
  className?: string;
  variant?: Variant;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = node.getBoundingClientRect();
    if (rect.top < innerHeight * 0.92) return;
    node.dataset.revealReady = "true";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.dataset.visible = "true";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal reveal-${variant} ${className}`}>
      {children}
    </div>
  );
}
