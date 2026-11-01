import { type Locale } from "@/lib/site/content";
import { ProductCta } from "@/components/site/ProductCta";

export function PageCta({ locale, title }: { locale: Locale; title: string }) {
  return (
    <section className="page-cta">
      <div className="wrap page-cta-inner">
        <div>
          <h2>{title}</h2>
        </div>
        <ProductCta locale={locale} />
      </div>
    </section>
  );
}
