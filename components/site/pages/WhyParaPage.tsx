import { BeliefMoment } from "@/components/site/BeliefMoment";
import { PageCta } from "@/components/site/PageCta";
import { PageHero } from "@/components/site/PageHero";
import { ParaFigure } from "@/components/site/ParaFigure";
import { content, type Locale } from "@/lib/site/content";

export function WhyHowl0Page({ locale }: { locale: Locale }) {
  const dictionary = content[locale];
  const page = dictionary.why;
  return (
    <main id="main" className="page-enter">
      <PageHero eyebrow={page.eyebrow} title={page.title} intro={page.intro} />
      <section className="problem section-pad">
        <div className="wrap problem-grid">
          <div>
            <h2>{page.missingTitle}</h2>
            <p className="section-copy">{page.missingCopy}</p>
          </div>
          <div>
            <ParaFigure asset="progress-arc" locale={locale} />
            <ul className="connected-signals">
              {page.fragments.map((fragment) => (
                <li key={fragment}>{fragment}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <BeliefMoment content={dictionary.belief} locale={locale} />
      <PageCta locale={locale} title={page.ctaTitle} />
    </main>
  );
}
