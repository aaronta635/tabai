import { PageCta } from "@/components/site/PageCta";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { ParaFigure } from "@/components/site/ParaFigure";
import { ExpressiveIcon } from "@/components/site/ExpressiveIcon";
import { content, type Locale } from "@/lib/site/content";

export function ProductPage({ locale }: { locale: Locale }) {
  const page = content[locale].product;
  return (
    <main id="main" className="page-enter">
      <PageHero eyebrow={page.eyebrow} title={page.title} intro={page.intro}>
        <div>
          <ParaFigure asset="rhythm-grid" locale={locale} eager />
          <p className="flow-summary">{page.visual}</p>
        </div>
      </PageHero>
      <section
        className="platform-reveal surface-noise"
        aria-labelledby="product-pillars"
      >
        <div className="wrap">
          <Reveal className="platform-intro">
            <p className="eyebrow">{page.eyebrow}</p>
            <h2 id="product-pillars">{page.pillars[2][1]}</h2>
          </Reveal>
          <ol className="platform-directions">
            {page.pillars.map(([number, title, copy], index) => (
              <li key={title}>
                <span>{number}</span>
                <ExpressiveIcon
                  name={["recording", "feedback", "progress"][index]}
                />
                <h3>{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="teacher-principle surface-noise">
        <div className="wrap principle-grid">
          <h2>{page.principle}</h2>
          <p>{page.principleCopy}</p>
        </div>
      </section>
      <PageCta locale={locale} title={page.ctaTitle} />
    </main>
  );
}
