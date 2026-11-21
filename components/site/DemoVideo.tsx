"use client";

import { useEffect, useRef, useState } from "react";

// All instances share an exclusive playback policy, including manual play.
type Player = {
  frame: HTMLElement;
  src: string;
  motion: MediaQueryList;
  userPaused: () => boolean;
  manual: boolean;
};
const players = new Map<HTMLVideoElement, Player>();

function setManualPlayback(element: HTMLVideoElement | null, manual: boolean) {
  if (!element) return;
  const player = players.get(element);
  if (player) player.manual = manual;
}

function visibility(frame: HTMLElement) {
  const box = frame.getBoundingClientRect();
  return (
    Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 76)) /
    box.height
  );
}

/** Intersection events choose one winner; no scroll-frame React updates. */
function reconcilePlayback() {
  let winner: HTMLVideoElement | undefined;
  let score = -1;
  players.forEach((player, element) => {
    const ratio = visibility(player.frame);
    if (ratio < 0.6 || document.hidden) player.manual = false;
    if (
      document.hidden ||
      ratio < 0.6 ||
      player.userPaused() ||
      (player.motion.matches && !player.manual)
    )
      return;
    const next = ratio + (player.manual ? 10 : 0);
    if (next > score) {
      score = next;
      winner = element;
    }
  });
  players.forEach((player, element) => {
    if (element !== winner) element.pause();
    else if (element.paused) {
      if (!element.getAttribute("src")) {
        element.src = player.src;
        element.load();
      }
      element.play().catch(() => {});
    }
  });
}

type Props = {
  id: string;
  title: string;
  src: string;
  poster: string;
  description: string;
  caption: string;
};

export function DemoVideo({
  id,
  title,
  src,
  poster,
  description,
  caption,
}: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  function load() {
    const element = video.current;
    if (element && !element.getAttribute("src")) {
      element.src = src;
      element.load();
    }
    return element;
  }

  async function play() {
    const element = load();
    if (!element) return;
    setManualPlayback(element, true);
    setError("");
    try {
      await element.play();
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) {
        setError("Playback paused. Select Play demo to try again.");
      }
    }
  }

  useEffect(() => {
    const element = video.current;
    const target = frame.current;
    if (!element || !target) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const player = {
      frame: target,
      src,
      motion,
      userPaused: () => userPaused.current,
      manual: false,
    };
    players.set(element, player);
    const sync = () => reconcilePlayback();
    const changeMotion = () => {
      setManualPlayback(element, false);
      reconcilePlayback();
    };
    const observer = new IntersectionObserver(sync, {
      threshold: [0, 0.6, 1],
      rootMargin: "-76px 0px 0px",
    });
    observer.observe(target);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", changeMotion);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", changeMotion);
      element.pause();
      players.delete(element);
    };
  }, [src]);

  return (
    <figure className="para-feature-media" data-demo={id}>
      <div ref={frame} className="para-demo-frame">
        <video
          ref={video}
          id={`demo-${id}`}
          className="para-demo-video"
          width={1440}
          height={1080}
          poster={poster}
          preload="none"
          muted
          playsInline
          loop
          aria-label={`${title} Example concept demo`}
          aria-describedby={`demo-description-${id}`}
          onPlay={() => {
            players.forEach((_, other) => {
              if (other !== video.current) other.pause();
            });
            setPlaying(true);
          }}
          onPause={() => setPlaying(false)}
          onError={() =>
            setError("This demo could not load. Please try again.")
          }
        />
      </div>
      <figcaption>
        <div className="para-demo-toolbar">
          <span>Example · Concept demo</span>
          <button
            type="button"
            aria-controls={`demo-${id}`}
            aria-label={`${playing ? "Pause demo" : "Play demo"}: ${title}`}
            onClick={() => {
              const element = video.current;
              if (!element) return;
              if (playing) {
                userPaused.current = true;
                setManualPlayback(element, false);
                element.pause();
              } else {
                userPaused.current = false;
                void play();
              }
            }}
          >
            {playing ? "Pause demo" : "Play demo"}
          </button>
        </div>
        <p className="para-demo-caption">{caption}</p>
        <p id={`demo-description-${id}`} className="sr-only">
          {description}
        </p>
        {error && (
          <p className="para-demo-error" role="status">
            {error}
          </p>
        )}
        <noscript>
          <style>{`.para-demo-toolbar button{display:none}`}</style>
          <a className="para-demo-fallback" href={src}>
            Watch {title} demo
          </a>
        </noscript>
      </figcaption>
    </figure>
  );
}
