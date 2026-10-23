"use client";

import { useRef, type CSSProperties } from "react";
import { useVisibleAnimation } from "@/lib/site/hooks/useVisibleAnimation";

/** A five-second, CSS-driven view of the teacher-led practice loop. */
export function HeroLoopPreview({
  stages,
  parentView,
  visualMessage,
  aria,
}: {
  stages: readonly string[];
  parentView: string;
  visualMessage: string;
  aria: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useVisibleAnimation(root);

  return (
    <div
      ref={root}
      className="hero-preview"
      data-playing="false"
      aria-label={aria}
      role="img"
    >
      <span className="preview-task" aria-hidden="true">
        {stages[0]} <b>↗</b>
      </span>
      <span className="preview-link" aria-hidden="true">
        <strong>howl0.link/practice</strong>
      </span>
      <span className="preview-practice" aria-hidden="true">
        <i /> <i /> <i /> <i /> <i />
      </span>
      <span className="preview-files" aria-hidden="true">
        <b>{stages[2]}</b>
      </span>
      <span className="preview-feedback" aria-hidden="true">
        {stages[3]} ↗
      </span>
      <ol className="preview-stages" aria-hidden="true">
        {stages.map((word, index) => (
          <li key={word} style={{ "--step-index": index } as CSSProperties}>
            {word}
          </li>
        ))}
      </ol>
      <span className="preview-parent" aria-hidden="true">
        {parentView}
      </span>
      <span className="preview-message" aria-hidden="true">
        {visualMessage}
      </span>
    </div>
  );
}
