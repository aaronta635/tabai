"use client";

import { useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { localePath, type Locale } from "@/lib/site/content";
import { sceneCopy } from "@/lib/site/studio";
import { PerspectiveSignal } from "@/components/site/PerspectiveSignal";
import { SceneHeading } from "@/components/site/SceneHeading";
import { ScrollScene } from "@/components/site/ScrollScene";
import { ParaIcon } from "@/components/site/ParaIcon";

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
    <ScrollScene
      id="perspectives"
      className="scene-perspectives session-perspectives"
    >
      <div
        className="wrap perspective-scene-grid"
        style={{ "--audience": active } as CSSProperties}
      >
        <div className="perspective-intro session-intro">
          <SceneHeading lines={copy.perspectivesLines} />
          <p className="session-support">{content.title}</p>
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
                {item.name}
              </button>
            ))}
            <span className="audience-tab-indicator" aria-hidden="true" />
          </div>
          <div className="perspective-panes session-explanations">
            {content.items.map((item, index) => (
              <div
                className={`perspective-pane ${index === active ? "active" : ""}`}
                key={item.name}
                id={`perspective-panel-${index}`}
                role="tabpanel"
                tabIndex={index === active ? 0 : -1}
                aria-hidden={index !== active}
                inert={index !== active}
                aria-labelledby={`perspective-tab-${index}`}
              >
                <h3>{content.items[index].copy}</h3>
                {index === 2 && <p>{copy.parentNote}</p>}
              </div>
            ))}
          </div>
          <Link
            className="text-link"
            href={localePath(locale, "/for-you")}
            prefetch={false}
          >
            {content.link}
            <ParaIcon name="arrow-right" />
          </Link>
          <noscript>
            <div className="no-js-perspectives">
              {content.items.slice(1).map((item, index) => (
                <p key={item.name}>
                  <strong>{item.name}: </strong>
                  {copy.perspectives[index + 1]}
                  {index === 1 && <small>{copy.parentNote}</small>}
                </p>
              ))}
            </div>
          </noscript>
        </div>
        <PerspectiveSignal locale={locale} active={active} />
      </div>
    </ScrollScene>
  );
}
