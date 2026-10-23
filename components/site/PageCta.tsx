import { content, homeHref, type Locale } from "@/lib/site/content";
import { ParaIcon } from "@/components/site/ParaIcon";

export function PageCta({ locale, title }: { locale: Locale; title: string }) {
  const dictionary = content[locale].navigation;
  return (
    <section className="page-cta">
      <div className="wrap page-cta-inner">
        <div>
          <p className="eyebrow light">{dictionary.waitlist}</p>
          <h2>{title}</h2>
        </div>
        <a className="button button-light" href={homeHref(locale, "#waitlist")}>
          {dictionary.waitlist} <ParaIcon name="arrow-right" />
        </a>
      </div>
    </section>
  );
}
