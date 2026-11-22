import Link from "next/link";
import { content, localePath, type Locale } from "@/lib/site/content";
import { editorialCopy } from "@/lib/site/editorial-copy";
import { EditorialMotionText } from "@/components/site/EditorialMotionText";
import { FeatureShowcase } from "@/components/site/FeatureShowcase";
import { EditorialEffects } from "@/components/site/EditorialGsapEffects";
import { EditorialCta } from "@/components/site/EditorialHeader";
import { StudioEntry } from "@/components/site/studio-entry";
import "@/styles/site/editorial-home.css";
import "@/styles/site/reference-home.css";

const assets = "/brand/para/homepage/";

export function EditorialHome({ locale = "en" }: { locale?: Locale }) {
  const copy = editorialCopy[locale];
  const site = content[locale];
  return (
    <main id="main" className="para-editorial">
      <EditorialEffects />
      <section className="ed-hero-stage" aria-labelledby="ed-title">
        <div className="ed-hero">
          <div className="ed-hero-copy">
            <h1 id="ed-title">
              <span>
                {copy.hero.titleLead} <em className="ed-focus-word">{copy.hero.titleFocus}</em>
              </span>{" "}
              <span>{copy.hero.titleTail}</span>
            </h1>
            <p>{copy.hero.intro}</p>
            <div className="ed-hero-actions">
              <EditorialCta locale={locale} />
            </div>
          </div>
          <div className="ed-hero-art" aria-hidden="true">
            <picture>
              <source
                media="(forced-colors: active)"
                srcSet={`${assets}para-symbol-black.svg`}
              />
              <img
                src={`${assets}para-symbol-faceted.svg`}
                alt=""
                width={290}
                height={300}
                fetchPriority="high"
              />
            </picture>
          </div>
        </div>
      </section>
      <FeatureShowcase locale={locale} />
      <section className="ed-belief ed-wrap" aria-labelledby="ed-belief-title">
        <h2 id="ed-belief-title">
          <EditorialMotionText text={copy.belief.lead} />{" "}
          <em className="ed-signal-word">{copy.belief.signal}</em>
          <br />
          <span className="ed-belief-secondary">
            <EditorialMotionText text={copy.belief.tail} />
          </span>
        </h2>
        <svg
          className="ed-belief-route"
          viewBox="0 0 900 100"
          fill="none"
          aria-hidden="true"
        >
          <path d="M0 60H180C260 60 260 15 340 15S440 85 520 60S650 60 900 40" />
          <circle cx="520" cy="60" r="5" />
        </svg>
      </section>
      <section className="ed-close ed-wrap" aria-labelledby="ed-close-title">
        <h2 id="ed-close-title">
          <EditorialMotionText text={copy.close.title} />
        </h2>
        <EditorialCta locale={locale} />
        {/* tabai: students with a class code and returning users still start here. */}
        <StudioEntry locale={locale} />
      </section>
      <footer className="ed-footer ed-wrap">
        <span>© {new Date().getFullYear()} PARA Music</span>
        <nav className="ed-footer-links" aria-label={site.footer.navigationLabel}>
          <Link href={localePath(locale, "/product")} prefetch={false}>
            {copy.footer.explore}
          </Link>
          {site.footer.legal.map(([label, href]) => (
            <Link href={localePath(locale, href)} key={href} prefetch={false}>
              {label}
            </Link>
          ))}
        </nav>
      </footer>
    </main>
  );
}
