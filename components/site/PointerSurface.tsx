"use client";

import { useRef, type ReactNode } from "react";
import { usePointerSurface } from "@/lib/site/hooks/usePointerSurface";

/** Only decorative inner layers move. The pointer/click target stays stable. */
export function PointerSurface({
  as = "div",
  className = "",
  href,
  depth = false,
  children,
}: {
  as?: "div" | "figure" | "a";
  className?: string;
  href?: string;
  depth?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement & HTMLAnchorElement>(null);
  usePointerSurface(ref);
  const Tag = as;
  return (
    <Tag
      ref={ref}
      href={href}
      className={`interactive-surface ${className}`}
      data-depth={depth || undefined}
    >
      {children}
      <span className="surface-light" aria-hidden="true" />
    </Tag>
  );
}
