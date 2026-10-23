import { ParaFigure } from "@/components/site/ParaFigure";
import { paraContent } from "@/lib/site/para";
import type { Locale } from "@/lib/site/content";
import { SceneHeading } from "@/components/site/SceneHeading";
import { ScrollScene } from "@/components/site/ScrollScene";
import { sceneCopy } from "@/lib/site/studio";
import { ExpressiveIcon } from "@/components/site/ExpressiveIcon";
import { BeliefFocus } from "@/components/site/BeliefFocus";
import Image from "next/image";
export function BeliefMoment({
  content,
  locale,
  immersive = false,
}: {
  content: {
    eyebrow: string;
    title: string;
    copy: string;
    labels: readonly string[];
  };
  locale: Locale;
  immersive?: boolean;
}) {
  if (immersive) {
    const copy = sceneCopy(locale);
    return (
      <ScrollScene id="belief" className="scene-belief belief-with-photograph">
        <div className="belief-aperture" aria-hidden="true" />
        <div className="belief-photograph" aria-hidden="true">
          <Image
            src="/images/performance/guitar-stage.webp"
            alt=""
            fill
            sizes="(max-width: 900px) 100vw, (min-width: 1600px) 1120px, 78vw"
            loading="lazy"
          />
        </div>
        <div className="belief-photo-scrim" aria-hidden="true" />
        <div className="wrap belief-statement">
          <div className="belief-copy">
            <p className="eyebrow">{content.eyebrow}</p>
            <div className="belief-emblem-surface">
              <ExpressiveIcon name="feedback" className="belief-emblem" />
            </div>
            <SceneHeading lines={copy.beliefLines} />
          </div>
          <div className="belief-signal" aria-hidden="true">
            <svg viewBox="0 0 1240 170" preserveAspectRatio="none">
              <path
                className="belief-wave-echo"
                d="M0 90C100 20 170 160 280 90S450 20 560 90S730 160 840 90S1010 20 1240 90"
              />
              <path
                className="belief-wave-main"
                pathLength="1"
                d="M0 90C100 20 170 160 280 90S450 20 560 90S730 160 840 90S1010 20 1240 90"
              />
              <circle cx="560" cy="90" r="7" />
            </svg>
          </div>
          <BeliefFocus labels={content.labels} locale={locale} />
        </div>
      </ScrollScene>
    );
  }
  return (
    <section id="belief" className="belief section-pad">
      <div className="wrap belief-grid">
        <div>
          <p className="eyebrow">{content.eyebrow}</p>
          <h2>{content.title}</h2>
          <p>{content.copy}</p>
          <ol className="feedback-markers">
            {content.labels.map((label, index) => (
              <li key={label}>
                <span>0{index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        </div>
        <ParaFigure
          asset="feedback-wave"
          locale={locale}
          caption={paraContent[locale].concept}
        />
      </div>
    </section>
  );
}
