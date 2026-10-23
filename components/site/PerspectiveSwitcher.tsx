"use client";

import { useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { localePath, type Locale } from "@/lib/site/content";
import { sceneCopy } from "@/lib/site/studio";
import { PerspectiveSignal } from "@/components/site/PerspectiveSignal";
import { SceneHeading } from "@/components/site/SceneHeading";
import { ScrollScene } from "@/components/site/ScrollScene";
import { ParaIcon } from "@/components/site/ParaIcon";
import { GlassSurface } from "@/components/site/GlassSurface";

export function PerspectiveSwitcher({
  locale,
  content,
}: {
  locale: Locale;
  content: {
    eyebrow: string;
    title: string;
    items: readonly { readonly name: string; readonly copy: string }[];
    link: string;
  };
}) {
  const copy = sceneCopy(locale);
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  function keyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % 3;
    else if (event.key === "ArrowLeft") next = (index + 2) % 3;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 2;
    else return;
    event.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  }
  return (
    <ScrollScene id="perspectives" className="scene-perspectives">
      <div className="wrap perspective-scene-grid">
        <div className="perspective-intro">
          <SceneHeading lines={copy.perspectivesLines} />
          <Link
            className="text-link"
            href={localePath(locale, "/for-you")}
            prefetch={false}
          >
            {content.link}
            <ParaIcon name="arrow-right" />
          </Link>
        </div>
        <div
          className="perspective-switcher"
          style={{ "--audience": active } as CSSProperties}
        >
          <div
            className="perspective-tabs"
            role="tablist"
            aria-label={content.eyebrow}
          >
            {content.items.map((item, index) => (
              <button
                key={item.name}
                ref={(node) => {
                  refs.current[index] = node;
                }}
                id={`perspective-tab-${index}`}
                role="tab"
                aria-selected={active === index}
                aria-controls={`perspective-panel-${index}`}
                tabIndex={active === index ? 0 : -1}
                onClick={() => setActive(index)}
                onKeyDown={(event) => keyDown(event, index)}
              >
                <span>0{index + 1}</span>
                {item.name}
              </button>
            ))}
            <span className="audience-tab-indicator" aria-hidden="true" />
          </div>
          <div className="perspective-workspace">
            <PerspectiveSignal locale={locale} active={active} />
            <GlassSurface
              material="quiet"
              raised
              interactive
              className="perspective-reading"
            >
              <div className="perspective-panes">
                {content.items.map((item, index) => (
                  <div
                    className={`perspective-pane ${index === active ? "active" : ""}`}
                    key={item.name}
                    id={`perspective-panel-${index}`}
                    role="tabpanel"
                    tabIndex={index === active ? 0 : -1}
                    aria-hidden={index !== active}
                    aria-labelledby={`perspective-tab-${index}`}
                  >
                    <h3>{copy.perspectives[index]}</h3>
                    {index === 2 && <p>{copy.parentNote}</p>}
                  </div>
                ))}
              </div>
            </GlassSurface>
          </div>
          <noscript>
            <div className="no-js-perspectives">
              {content.items.slice(1).map((item, index) => (
                <p key={item.name}>
                  <strong>{item.name}: </strong>
                  {copy.perspectives[index + 1]}
                </p>
              ))}
            </div>
          </noscript>
        </div>
      </div>
      <div className="perspective-handoff" aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M1110 0C1110 75 1050 80 1050 120" />
          <circle cx="1050" cy="114" r="7" />
        </svg>
      </div>
    </ScrollScene>
  );
}
