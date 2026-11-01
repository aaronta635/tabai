import { FaqPage } from "@/components/site/pages/FaqPage";
import { getLocale } from "@/lib/i18n";
import { content, type Locale } from "@/lib/site/content";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  const page = content[locale].faq;
  return { title: `${page.metadataTitle} — PARA`, description: page.note };
}

export default async function Page() {
  const locale = (await getLocale()) as Locale;
  return <FaqPage locale={locale} />;
}
