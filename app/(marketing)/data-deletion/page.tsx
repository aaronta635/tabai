import { LegalPage } from "@/components/site/pages/LegalPage";
import { getLocale } from "@/lib/i18n";
import { legal } from "@/lib/site/legal";
import type { Locale } from "@/lib/site/content";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  const document = legal[locale].deletion;
  return { title: `${document.title} — PARA`, description: document.description };
}

export default async function Page() {
  const locale = (await getLocale()) as Locale;
  return <LegalPage locale={locale} document={legal[locale].deletion} />;
}
