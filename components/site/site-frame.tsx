import { Navigation } from "@/components/site/Navigation";
import { SiteFooter } from "@/components/site/SiteFooter";
import { content, type Locale } from "@/lib/site/content";

export function SiteFrame({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <div className="para-site" lang={locale}>
      <a className="skip-link" href="#main">
        {content[locale].skip}
      </a>
      <Navigation locale={locale} />
      {children}
      <SiteFooter locale={locale} />
    </div>
  );
}
