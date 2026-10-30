"use client";

import { useEffect, useId, useState } from "react";

export type TourStep = { href: string; title: string; body: string; fallback?: string };

export type TourCopy = {
  role: "student" | "teacher";
  steps: TourStep[];
  back: string;
  next: string;
  close: string;
  done: string;
  progress: string;
};

const OPEN_EVENT = "para-tour-open";

export function openStudioTour() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function StudioTour({ tour }: { tour: TourCopy }) {
  const titleId = useId();
  const storageKey = `para-tour-${tour.role}`;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const current = tour.steps[step];

  function finish() {
    localStorage.setItem(storageKey, "1");
    setOpen(false);
  }

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) setOpen(true);
    function onOpen() {
      setStep(0);
      setOpen(true);
    }
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [storageKey]);

  useEffect(() => {
    if (!open || !current) return;
    function visibleTarget(href: string) {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${href}"]`));
      return nodes.find((node) => node.getClientRects().length > 0);
    }
    const visible = visibleTarget(current.href) ?? (current.fallback ? visibleTarget(current.fallback) : undefined);
    visible?.classList.add("is-tour-target");
    document.documentElement.classList.add("tour-open");
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") finish();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      visible?.classList.remove("is-tour-target");
      document.documentElement.classList.remove("tour-open");
      document.removeEventListener("keydown", onKey);
    };
  }, [open, current]);

  if (!open || !current) return null;
  const last = step === tour.steps.length - 1;

  return (
    <div className="studio-tour">
      <div className="studio-tour-dim" />
      <div className="studio-tour-card" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <p className="studio-tour-progress">
          {tour.progress.replace("{n}", String(step + 1)).replace("{total}", String(tour.steps.length))}
        </p>
        <h2 id={titleId}>{current.title}</h2>
        <p>{current.body}</p>
        <div className="studio-tour-actions">
          <button type="button" className="btn btn-quiet" onClick={finish}>
            {tour.close}
          </button>
          <span className="studio-tour-move">
            <button type="button" className="btn btn-quiet" disabled={step === 0} onClick={() => setStep((n) => n - 1)}>
              {tour.back}
            </button>
            {last ? (
              <button type="button" className="btn" onClick={finish}>
                {tour.done}
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => setStep((n) => n + 1)}>
                {tour.next}
              </button>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
