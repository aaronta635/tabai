import { FaqPage as FlootFaqPage } from "@/components/marketing/pages/FaqPage";
import { FaqPage } from "@/components/site/pages/FaqPage";
import { getLocale } from "@/lib/i18n";
import { flootMetadata } from "@/lib/marketing/metadata";
import { content, type Locale } from "@/lib/site/content";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  if (locale === "vi") return flootMetadata.faq;
  const page = content[locale].faq;
  return { title: `${page.metadataTitle} — PARA`, description: page.note };
}

export default async function Page() {
  const locale = (await getLocale()) as Locale;
  if (locale === "vi") return <FlootFaqPage />;
  return <FaqPage locale={locale} />;
}
