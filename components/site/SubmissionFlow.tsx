"use client";

import {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { content, type Locale } from "@/lib/site/content";
import { sceneCopy } from "@/lib/site/studio";
import { useScrollProgress } from "@/lib/site/hooks/useScrollProgress";
import { ParaIcon } from "@/components/site/ParaIcon";
import { ExpressiveIcon } from "@/components/site/ExpressiveIcon";
import { GlassSurface } from "@/components/site/GlassSurface";
import { LoopWaves } from "@/components/site/LoopWaves";

const route =
  "M126 114C220 20 362 18 444 110S615 243 540 332S398 498 260 438S60 305 126 114";

/** One progress measurement drives the traveller, visual stage and headline. */
export type SubmissionFlowHandle = { update: (value: number) => void };

export function SubmissionFlow({
  locale,
  coordinated = false,
  flowRef,
  waveActive = true,
}: {
  locale: Locale;
  coordinated?: boolean;
  flowRef?: Ref<SubmissionFlowHandle>;
  waveActive?: boolean;
}) {
  const page = content[locale].home;
  const copy = sceneCopy(locale);
  const root = useRef<HTMLElement>(null);
  const path = useRef<SVGPathElement>(null);
  const traveller = useRef<SVGGElement>(null);
  const length = useRef(0);
  const [stage, setStage] = useState(-1);
  const update = useCallback((value: number) => {
    const element = root.current;
    const curve = path.current;
    if (!element || !curve) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const progress = reduced
      ? 1
      : Math.max(0, Math.min(1, (value - 0.12) / 0.88));
    const current =
      reduced || value < 0.12 ? -1 : Math.min(4, Math.floor(progress * 5));
    setStage((previous) => (previous === current ? previous : current));
    element.dataset.enhanced = "true";
    element.dataset.stage = String(current < 0 ? (reduced ? 4 : 0) : current);
    element.style.setProperty("--loop-progress", String(progress));
    length.current ||= curve.getTotalLength();
    const point = curve.getPointAtLength(
      length.current * (0.04 + progress * 0.92),
    );
    traveller.current?.setAttribute(
      "transform",
      `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`,
    );
  }, []);
  useImperativeHandle(flowRef, () => ({ update }), [update]);
  useScrollProgress(root, {
    enabled: !coordinated,
    mode: "pin",
    onProgress: update,
    settleMs: 55,
  });
  return (
    <section
      ref={root}
      id={coordinated ? "learning-loop" : "submission-flow"}
      className="scene-loop"
      data-stage="0"
      aria-labelledby="submission-flow-heading"
    >
      <div className="loop-sticky wrap">
        <LoopWaves locale={locale} active={waveActive} />
        <div className="loop-heading-slot">
          <h2
            id="submission-flow-heading"
            className="loop-current-heading"
            data-headline-stage={stage}
          >
            <span key={stage}>
              {stage < 0 ? copy.loopLines.join(" ") : page.hero.stages[stage]}
            </span>
          </h2>
        </div>
        <figure className="loop-composition">
          <div className="loop-diagram" role="img" aria-label={page.hero.aria}>
            <div className="loop-symbols" aria-hidden="true">
              {[
                "assignment",
                "rhythm",
                "recording",
                "feedback",
                "next-step",
              ].map((name, index) => (
                <ExpressiveIcon
                  key={name}
                  name={name}
                  className={`loop-symbol symbol-${index}`}
                />
              ))}
            </div>
            <div className="loop-recording-ground" aria-hidden="true">
              <GlassSurface raised rising />
            </div>
            <svg viewBox="0 0 680 540" fill="none" aria-hidden="true">
              <path className="loop-route-base" d={route} />
              <path
                ref={path}
                className="loop-route-active"
                pathLength="1"
                d={route}
              />
              <path
                className="loop-interval"
                d="M160 242H530M160 270H530M160 298H530"
              />
              <path
                className="loop-wave"
                pathLength="1"
                d="M190 270H213L226 235L239 312L254 216L269 320L284 253L299 286L314 230L330 312L345 255L360 282L376 237L391 300L407 267H482"
              />
              <g className="loop-feedback-pins">
                <path d="M254 192V334M345 192V334M436 192V334" />
                <circle cx="254" cy="270" r="9" />
                <circle cx="345" cy="270" r="9" />
                <circle cx="436" cy="270" r="9" />
              </g>
              <path
                className="loop-next-path"
                d="M482 270C535 270 558 371 465 408M470 392L461 411L483 413"
              />
              <g
                ref={traveller}
                className="loop-traveller"
                transform="translate(126 114)"
              >
                <circle r="14" />
                <circle r="5" />
              </g>
              <circle className="loop-start" cx="126" cy="114" r="6" />
            </svg>
            <div className="loop-task-capsule">
              <GlassSurface material="quiet" className="assignment-material">
                <ParaIcon name="assignment" music />
                {copy.assignment}
                <span aria-hidden="true">↗</span>
              </GlassSurface>
            </div>
            <span className="loop-record-label">{copy.recording}</span>
            <span className="loop-response-label">{copy.feedback}</span>
            <div className="loop-timestamp">
              <GlassSurface material="smoke" className="feedback-material">
                <ParaIcon name="comment" />
                <span aria-hidden="true">0:28</span>
                <span className="sr-only">{copy.feedback}</span>
              </GlassSurface>
            </div>
            <span className="loop-next-instruction">
              {copy.instruction}
              <span aria-hidden="true">↗</span>
            </span>
          </div>
          <figcaption>{copy.concept}</figcaption>
          <p className="loop-static-summary">{page.hero.aria}</p>
        </figure>
      </div>
      <noscript>
        <style>{`.studio-home .scene-loop{min-height:0}.studio-home .loop-sticky{position:relative;top:auto;min-height:0;padding-block:48px}`}</style>
      </noscript>
    </section>
  );
}
