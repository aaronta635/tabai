"use client";

import Link from "next/link";
import { content, localePath, type Locale } from "@/lib/site/content";
import { sceneCopy } from "@/lib/site/studio";
import { SceneHeading } from "@/components/site/SceneHeading";
import { ParaIcon } from "@/components/site/ParaIcon";
import { PointerSurface } from "@/components/site/PointerSurface";

export function HomeIntro({ locale }: { locale: Locale }) {
  const hero = content[locale].home.hero;
  const copy = sceneCopy(locale);
  return (
    <section className="home-hero scene-hero simple-hero" data-playing="false">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">{hero.eyebrow}</p>
          <SceneHeading level={1} lines={copy.heroLines} />
          <p className="hero-lead">{copy.platform}</p>
          <div className="hero-actions">
            <PointerSurface
              as="a"
              className="button button-primary"
              href="#submission-flow"
            >
              {hero.primary}
              <ParaIcon name="arrow-right" />
            </PointerSurface>
            <Link
              className="text-link"
              href={localePath(locale, "/product")}
              prefetch={false}
            >
              {copy.discover}
              <ParaIcon name="arrow-right" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
