"use client";

import Link from "next/link";
import { content, localePath, type Locale } from "@/lib/site/content";
import { sceneCopy } from "@/lib/site/studio";
import { SceneHeading } from "@/components/site/SceneHeading";
import { ParaIcon } from "@/components/site/ParaIcon";
import { ProductCta } from "@/components/site/ProductCta";

export function HomeIntro({ locale }: { locale: Locale }) {
  const hero = content[locale].home.hero;
  const copy = sceneCopy(locale);
  return (
    <section className="home-hero scene-hero simple-hero" data-playing="false">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">{hero.eyebrow}</p>
          <SceneHeading level={1} lines={copy.heroLines} />
          <div className="hero-brand-symbol" aria-hidden="true">
            <picture>
              <source
                media="(prefers-color-scheme: dark)"
                srcSet="/brand/para/resources/para-symbol-dark-grain-optical.svg"
              />
              <img
                src="/brand/para/resources/para-symbol-light-grain-optical.svg"
                width={290}
                height={300}
                alt=""
              />
            </picture>
          </div>
          <p className="hero-lead">{copy.platform}</p>
          <div className="hero-actions">
            <ProductCta locale={locale} />
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
