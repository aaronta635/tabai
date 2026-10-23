import { ParaFigure } from "@/components/site/ParaFigure";
import type { Locale } from "@/lib/site/content";

export function PracticeLoop({
  content,
  locale,
}: {
  content: {
    journeyEyebrow: string;
    journeyTitle: string;
    journeySummary: string;
    journeyAria: string;
    steps: readonly (readonly [string, string])[];
  };
  locale: Locale;
}) {
  return (
    <section
      id="practice-loop"
      className="practice-loop section-pad"
      aria-labelledby="practice-loop-heading"
    >
      <div className="wrap practice-grid">
        <div>
          <p className="eyebrow">{content.journeyEyebrow}</p>
          <h2 id="practice-loop-heading">{content.journeyTitle}</h2>
          <p className="flow-summary">{content.journeySummary}</p>
          <ol className="practice-steps" aria-label={content.journeyAria}>
            {content.steps.map(([title, phrase], index) => (
              <li className="practice-step" key={title}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{phrase}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <ParaFigure asset="practice-loop" locale={locale} />
      </div>
    </section>
  );
}
