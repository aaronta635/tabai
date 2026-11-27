import { MessageCircle, Repeat, Upload } from "lucide-react";
import { DemoVideo } from "@/components/site/DemoVideo";
import { SITE_ICON_STROKE } from "@/components/site/ParaIcon";
import { EditorialMotionText } from "@/components/site/EditorialMotionText";
import type { Locale } from "@/lib/site/content";
import { editorialCopy } from "@/lib/site/editorial-copy";
import "@/styles/site/feature-showcase.css";

const icons = { take: Upload, feedback: MessageCircle, next: Repeat } as const;
const files = {
  take: "para-your-take-macos",
  feedback: "para-your-teachers-note-macos",
  next: "para-your-next-try-macos",
} as const;

export function FeatureShowcase({ locale = "en" }: { locale?: Locale }) {
  const copy = editorialCopy[locale];
  return (
    <section
      id="how-it-works"
      className="para-feature-showcase"
      aria-label={copy.showcase.label}
    >
      <div className="para-feature-column">
        {copy.showcase.demos.map((demo) => {
          const [first, ...rest] = demo.titleLines;
          const title = demo.titleLines.join(" ");
          const Icon = icons[demo.id];
          return (
            <article
              key={demo.id}
              className={`para-feature para-feature--${demo.id}`}
              aria-labelledby={`feature-${demo.id}`}
            >
              <div className="para-feature-copy">
                <p className="para-feature-eyebrow">{demo.eyebrow}</p>
                <h2 id={`feature-${demo.id}`}>
                  <EditorialMotionText text={first} />
                  {rest.length > 0 ? (
                    <>
                      {" "}
                      <span>
                        <EditorialMotionText text={rest.join(" ")} />
                      </span>
                    </>
                  ) : null}
                </h2>
                <p className="para-feature-summary">{demo.copy}</p>
                <Icon
                  className="para-feature-icon"
                  width={40}
                  height={40}
                  strokeWidth={SITE_ICON_STROKE}
                  aria-hidden="true"
                  focusable="false"
                />
              </div>
              <DemoVideo
                id={demo.id}
                title={title}
                src={`/brand/para/demos/${files[demo.id]}.mp4`}
                poster={`/brand/para/demos/${demo.id}-poster.webp`}
                description={demo.description}
                caption={demo.caption}
                labels={copy.demo}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
