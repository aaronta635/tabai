"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Locale } from "@/lib/site/content";
import { HomeIntro } from "@/components/site/HomeIntro";
import {
  SubmissionFlow,
  type SubmissionFlowHandle,
} from "@/components/site/SubmissionFlow";
import { ParaWordPortal } from "@/components/site/ParaWordPortal";
import { useScrollProgress } from "@/lib/site/hooks/useScrollProgress";

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const range = (n: number, start: number, end: number) =>
  clamp((n - start) / (end - start));
const smooth = (n: number) => n * n * (3 - 2 * n);

// One normalized clock: hero / word entrance / hold / zoom / intro / lesson.
// The lesson's existing introductory 12% hold remains intact after INTRO.
export const JOURNEY = {
  heroExit: 0.075,
  wordIn: 0.17,
  zoomStart: 0.235,
  zoomEnd: 0.55,
  intro: 0.62,
} as const;

export function HeroLoopJourney({ locale }: { locale: Locale }) {
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const camera = useRef<SVGGElement>(null);
  const flow = useRef<SubmissionFlowHandle>(null);
  const initialized = useRef(false);
  const lastProgress = useRef(0);

  const update = useCallback((progress: number) => {
    const element = root.current;
    const stage = viewport.current;
    if (!element || !stage || !camera.current || !initialized.current) return;
    lastProgress.current = progress;
    const eligible =
      !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !matchMedia("(forced-colors: active)").matches &&
      innerHeight >= 480;
    element.dataset.journeyReady = String(eligible);
    const hero = element.querySelector<HTMLElement>(".simple-hero");
    const loop = element.querySelector<HTMLElement>(".scene-loop");
    if (!hero || !loop) return;
    if (!eligible) {
      hero.inert = false;
      loop.inert = false;
      hero.removeAttribute("aria-hidden");
      loop.removeAttribute("aria-hidden");
      flow.current?.update(0);
      return;
    }

    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const wordIn = smooth(range(progress, JOURNEY.heroExit, JOURNEY.wordIn));
    const exit = smooth(range(progress, JOURNEY.heroExit, 0.15));
    const zoom = smooth(range(progress, JOURNEY.zoomStart, JOURNEY.zoomEnd));
    const reveal = smooth(range(progress, JOURNEY.zoomEnd, JOURNEY.intro));
    const initialScale = Math.min((width * 0.84) / 751, (height * 0.34) / 210);
    // Zoom into the R's solid lower stem, not its bowl or an A counter.
    // A radius 16 source-unit circle at (392, 170) is inside that stem.
    // It is close to the word's optical centre, avoiding a lateral camera sweep.
    // Cover the viewport diagonal with 20% overscan before removing the mask.
    const finalScale = (Math.hypot(width / 2, height / 2) / 16) * 1.2;
    const scale = initialScale * Math.pow(finalScale / initialScale, zoom);
    const focusX = 375.5 + (392 - 375.5) * zoom;
    const focusY = 105 + (170 - 105) * zoom;
    camera.current.setAttribute(
      "transform",
      `translate(${width / 2} ${height / 2}) scale(${scale}) translate(${-focusX} ${-focusY})`,
    );
    element.style.setProperty("--journey-hero-opacity", String(1 - exit));
    element.style.setProperty("--journey-hero-y", `${-36 * exit}px`);
    element.style.setProperty("--journey-word-in", String(wordIn));
    element.style.setProperty(
      "--journey-word-ink",
      String(wordIn * (1 - smooth(range(zoom, 0, 0.3)))),
    );
    element.style.setProperty("--journey-loop-reveal", String(reveal));
    element.style.setProperty("--journey-loop-y", `${20 * (1 - reveal)}px`);
    element.dataset.portal = progress >= JOURNEY.zoomEnd ? "open" : "masked";
    element.dataset.phase =
      progress < JOURNEY.heroExit
        ? "hero"
        : progress < JOURNEY.zoomStart
          ? "word"
          : progress < JOURNEY.zoomEnd
            ? "zoom"
            : progress < JOURNEY.intro
              ? "intro"
              : "loop";
    hero.inert = exit > 0.98;
    hero.setAttribute("aria-hidden", String(exit > 0.98));
    loop.inert = reveal < 0.15;
    loop.setAttribute("aria-hidden", String(reveal < 0.15));
    // Native fragment navigation targets the physical intro position, outside
    // the sticky viewport. No click interception or history mutations.
    const distance = Math.max(1, element.clientHeight - innerHeight);
    const header = Math.max(0, innerHeight - height);
    const anchorPadding =
      parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) ||
      header;
    element.style.setProperty(
      "--journey-intro-offset",
      `${distance * JOURNEY.intro + anchorPadding}px`,
    );
    flow.current?.update(range(progress, JOURNEY.intro, 1));
  }, []);

  useScrollProgress(root, { mode: "pin", onProgress: update, settleMs: 55 });

  useEffect(() => {
    let disposed = false;
    let restored = false;
    let restoreFrame = 0;
    const forced = matchMedia("(forced-colors: active)");
    const sync = () => update(lastProgress.current);
    const storageKey = `para:journey:${location.pathname}${location.search}`;
    // Height changes at hydration can confuse native reload restoration. Save
    // only on pagehide, then correct that one restoration after layout settles.
    // This never runs during scrolling or takes ownership of browser history.
    const remember = () => {
      const element = root.current;
      if (!element || element.dataset.journeyReady !== "true") return;
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            y: scrollY,
            top: element.getBoundingClientRect().top + scrollY,
            distance: element.clientHeight - innerHeight,
          }),
        );
      } catch {
        // Storage restrictions must not prevent the native fallback.
      }
    };
    const restore = () => {
      if (
        disposed ||
        restored ||
        !initialized.current ||
        document.readyState !== "complete"
      )
        return;
      if (restoreFrame) cancelAnimationFrame(restoreFrame);
      restoreFrame = requestAnimationFrame(() => {
        restoreFrame = requestAnimationFrame(() => {
          if (disposed || !root.current) return;
          restored = true;
          const navigation = performance.getEntriesByType("navigation")[0] as
            PerformanceNavigationTiming | undefined;
          let saved: { y: number; top: number; distance: number } | null = null;
          try {
            if (navigation?.type === "reload") {
              saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
            }
          } catch {}
          if (
            saved &&
            Number.isFinite(saved.y) &&
            Number.isFinite(saved.top) &&
            saved.distance > 0 &&
            root.current.dataset.journeyReady === "true"
          ) {
            const top = root.current.getBoundingClientRect().top + scrollY;
            const distance = root.current.clientHeight - innerHeight;
            const p = (saved.y - saved.top) / saved.distance;
            const y =
              p < 0
                ? saved.y
                : p <= 1
                  ? top + p * distance
                  : top + distance + saved.y - saved.top - saved.distance;
            scrollTo({ top: y, behavior: "instant" });
          } else if (location.hash) {
            // Any initial deep link, including the closing form, must account
            // for the new scene height. Later anchor clicks remain native.
            let id = location.hash.slice(1);
            try {
              id = decodeURIComponent(id);
            } catch {}
            document
              .getElementById(id)
              ?.scrollIntoView({ behavior: "instant" });
          }
        });
      });
    };
    // Do not pin until fonts and the exact vector geometry are available.
    document.fonts.ready.then(() => {
      if (disposed) return;
      initialized.current = true;
      update(lastProgress.current);
      restore();
    });
    forced.addEventListener("change", sync);
    window.addEventListener("pagehide", remember);
    window.addEventListener("pageshow", restore);
    return () => {
      disposed = true;
      initialized.current = false;
      forced.removeEventListener("change", sync);
      window.removeEventListener("pagehide", remember);
      window.removeEventListener("pageshow", restore);
      if (restoreFrame) cancelAnimationFrame(restoreFrame);
    };
  }, [update]);

  return (
    <div
      ref={root}
      id="top"
      className="hero-loop-journey"
      data-loop-start={JOURNEY.intro}
    >
      <div ref={viewport} className="journey-viewport">
        <HomeIntro locale={locale} />
        <SubmissionFlow locale={locale} coordinated flowRef={flow} />
        <ParaWordPortal geometry={camera} />
      </div>
      <span
        id="submission-flow"
        className="journey-loop-anchor"
        aria-hidden="true"
      />
    </div>
  );
}
