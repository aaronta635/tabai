"use client";
import { useRef, type ReactNode } from "react";
import { useScrollProgress } from "@/lib/site/hooks/useScrollProgress";

export function ScrollScene({
  id,
  className,
  mode = "enter",
  stages,
  children,
}: {
  id?: string;
  className: string;
  mode?: "pin" | "enter";
  stages?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useScrollProgress(ref, { mode, stages });
  return (
    <section id={id} ref={ref} className={className}>
      {children}
    </section>
  );
}
