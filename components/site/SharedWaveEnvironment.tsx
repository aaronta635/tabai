"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useScrollProgress } from "@/lib/site/hooks/useScrollProgress";
import { LoopWaves } from "@/components/site/LoopWaves";
import { JOURNEY } from "@/components/site/HeroLoopJourney";

/** One document-space brightness clock. The portal and lesson keep their own
 * choreography; neither starts, replaces or repositions the shared renderer. */
export function SharedWaveEnvironment({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const brightness = useRef(1);
  const previous = useRef(false);
  const [exposed, setExposed] = useState(false);
  const update = useCallback(() => {
    const main = root.current;
    const journey = main?.querySelector<HTMLElement>(".hero-loop-journey");
    const loop = main?.querySelector<HTMLElement>("#learning-loop");
    if (!main || !journey || !loop) return;
    const top = journey.getBoundingClientRect().top + scrollY;
    const pinned =
      journey.dataset.journeyReady === "true" &&
      !matchMedia(
        "(prefers-reduced-motion: reduce), (forced-colors: active), (max-height: 479px)",
      ).matches;
    const distance = Math.max(0, journey.offsetHeight - innerHeight);
    const start = pinned
      ? top + distance * JOURNEY.intro
      : loop.getBoundingClientRect().top + scrollY;
    const end = main.getBoundingClientRect().bottom + scrollY - innerHeight;
    const progress = Math.max(
      0,
      Math.min(1, (scrollY - start) / Math.max(1, end - start)),
    );
    main.style.setProperty("--wave-progress", progress.toFixed(5));
    brightness.current = 1 + progress * 0.18;
    const visible =
      scrollY >=
        (pinned ? top + distance * JOURNEY.zoomStart : start - innerHeight) &&
      main.getBoundingClientRect().bottom > 0;
    if (visible !== previous.current) {
      previous.current = visible;
      setExposed(visible);
    }
  }, []);
  useScrollProgress(root, { mode: "pin", onProgress: update });
  useLayoutEffect(() => {
    update();
  }, [update]);
  return (
    <main ref={root} id="main" className="studio-home shared-wave-environment">
      <div className="shared-wave-layer">
        <div className="shared-wave-viewport">
          <LoopWaves active={exposed} brightnessFactor={brightness} />
        </div>
      </div>
      {children}
    </main>
  );
}
