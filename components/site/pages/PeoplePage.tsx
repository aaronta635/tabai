import { PageCta } from "@/components/site/PageCta";
import { PageHero } from "@/components/site/PageHero";
import { content, type Locale } from "@/lib/site/content";

export function PeoplePage({ locale }: { locale: Locale }) {
  const page = content[locale].people;
  return (
    <main id="main" className="page-enter">
      <PageHero eyebrow={page.eyebrow} title={page.title} intro={page.intro} />
      <section
        className="people-profiles section-pad"
        aria-label={page.eyebrow}
      >
        <div className="wrap people-grid">
          {page.profiles.map((person, index) => (
            <article className="people-profile" key={person.name}>
              <span className="people-index" aria-hidden="true">
                0{index + 1}
              </span>
              <div>
                <p className="eyebrow">{person.role}</p>
                <h2>{person.name}</h2>
                <p>{person.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="people-why surface-noise section-pad">
        <div className="wrap people-why-inner">
          <p className="eyebrow light">{page.whyEyebrow}</p>
          <h2>{page.whyTitle}</h2>
          <p>{page.whyCopy}</p>
        </div>
      </section>
      <PageCta locale={locale} title={page.ctaTitle} />
    </main>
  );
}
