import { WhyParaPage } from "@/components/site/pages/WhyParaPage";
import { getLocale } from "@/lib/i18n";
import { content, type Locale } from "@/lib/site/content";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  const page = content[locale].why;
  return { title: `${page.metadataTitle} — PARA`, description: page.intro };
}

export default async function Page() {
  const locale = (await getLocale()) as Locale;
  return <WhyParaPage locale={locale} />;
}
