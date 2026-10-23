import type { Locale } from "@/lib/site/content";

/** The hero is a brand composition. The instructional sequence lives below. */
export function SignalStory({ locale }: { locale: Locale }) {
  return (
    <div className="signal-story hero-artwork" aria-hidden="true">
      <div className="signal-sculpture">
        <div className="signal-material ambient" />
        <picture className="approved-listening ambient">
          <source
            media="(min-width: 1200px)"
            srcSet={`/brand/para/resources/para-art-03-listen-${locale}-grain.svg`}
          />
          <img
            src="/brand/para/resources/para-expressive-listening-grain.svg"
            alt=""
            width={680}
            height={540}
            fetchPriority="high"
          />
        </picture>
      </div>
    </div>
  );
}
