import { AudienceTabs } from "@/components/site/AudienceTabs";
import { PageCta } from "@/components/site/PageCta";
import { PageHero } from "@/components/site/PageHero";
import { content, type Locale } from "@/lib/site/content";

export function ForYouPage({ locale }: { locale: Locale }) {
  const page = content[locale].forYou;
  return (
    <main id="main" className="page-enter">
      <PageHero eyebrow={page.eyebrow} title={page.title} intro={page.intro} />
      <section className="audiences audience-page section-pad">
        <div className="wrap">
          <AudienceTabs
            audience={page.views}
            label={page.tabsLabel}
            locale={locale}
          />
        </div>
      </section>
      <PageCta locale={locale} title={page.ctaTitle} />
    </main>
  );
}
