import "@/styles/site/para.css";
import { SiteFrame } from "@/components/site/site-frame";
import { getLocale } from "@/lib/i18n";
import { content, homeHref, type Locale } from "@/lib/site/content";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  return { title: `${content[locale].notFound.metadataTitle} — PARA` };
}

export default async function NotFound() {
  const locale = (await getLocale()) as Locale;
  const page = content[locale].notFound;
  return (
    <SiteFrame locale={locale}>
      <main id="main">
        <header className="page-hero page-hero-light surface-noise" aria-labelledby="page-title">
          <div className="wrap page-hero-grid">
            <div className="page-hero-copy">
              <p className="eyebrow">{page.eyebrow}</p>
              <h1 id="page-title">{page.title}</h1>
              <p>{page.intro}</p>
              <p>
                <a className="text-link" href={homeHref(locale)}>
                  {page.home}
                </a>
              </p>
            </div>
          </div>
        </header>
      </main>
    </SiteFrame>
  );
}
