import { PageCta } from "@/components/site/PageCta";
import { PageHero } from "@/components/site/PageHero";
import { PracticeLoop } from "@/components/site/PracticeLoop";
import { ParaFigure } from "@/components/site/ParaFigure";
import { content, type Locale } from "@/lib/site/content";

export function HowItWorksPage({ locale }: { locale: Locale }) {
  const page = content[locale].howItWorks;
  return (
    <main id="main" className="page-enter">
      <PageHero eyebrow={page.eyebrow} title={page.title} intro={page.intro}>
        <ParaFigure asset="upload-transfer" locale={locale} eager />
      </PageHero>
      <PracticeLoop content={page} locale={locale} />
      <section className="flow-next section-pad">
        <div className="wrap flow-next-inner">
          <h2>{page.differentiator}</h2>
          <p className="simple-flow">{page.simpleFlow}</p>
          <p>{page.note}</p>
        </div>
      </section>
      <PageCta locale={locale} title={page.ctaTitle} />
    </main>
  );
}
