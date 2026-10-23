"use client";

import { useEffect, useRef, useState } from "react";
import { ParaIcon } from "@/components/site/ParaIcon";
import { sceneCopy } from "@/lib/site/studio";
import type { Locale } from "@/lib/site/content";

const TRANSITION_MS = 400;
const READ_MS = 3000;

export function BeliefFocus({
  labels,
  locale,
}: {
  labels: readonly string[];
  locale: Locale;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [available, setAvailable] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const copy = sceneCopy(locale);
  const playing = available && !paused && !hovering && !focused;

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () =>
      setAvailable(visible && !document.hidden && !reduced.matches);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    // Every new focus gets a complete 400ms transition, then 3000ms to read.
    // Visibility and user interaction cancel this timer; resuming starts a full hold.
    const timer = setTimeout(
      () => setActive((value) => (value + 1) % labels.length),
      TRANSITION_MS + READ_MS,
    );
    return () => clearTimeout(timer);
  }, [active, playing, labels.length]);

  return (
    <div
      ref={root}
      className="belief-focus"
      data-active={active}
      data-playing={playing}
      data-available={available}
    >
      <ul
        className="belief-cues"
        onPointerLeave={() => setHovering(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setFocused(false);
        }}
      >
        {labels.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              className="belief-phrase"
              aria-pressed={active === index}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") {
                  setActive(index);
                  setHovering(true);
                }
              }}
              onFocus={() => setActive(index)}
              onClick={() => {
                setActive(index);
                setPaused(true);
              }}
            >
              <span className="belief-phrase-index">0{index + 1}</span>
              <span className="belief-phrase-label">{label}</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="story-control belief-cycle-control"
        aria-pressed={paused}
        onClick={() => {
          setPaused((value) => !value);
          setFocused(false);
          setHovering(false);
        }}
      >
        {paused ? copy.resume : copy.pause}
        <ParaIcon name={paused ? "play" : "pause"} />
      </button>
    </div>
  );
}
