import { Faq } from "@/components/site/Faq";
import { PageHero } from "@/components/site/PageHero";
import { content, type Locale } from "@/lib/site/content";

export function FaqPage({ locale }: { locale: Locale }) {
  const page = content[locale].faq;
  return (
    <main id="main" className="page-enter">
      <PageHero eyebrow={page.eyebrow} title={page.title} intro={page.note} />
      <section className="faq faq-page section-pad">
        <div className="wrap faq-page-grid">
          <Faq items={page.items} />
        </div>
      </section>
    </main>
  );
}
