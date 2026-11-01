import { HomePage } from "@/components/site/pages/HomePage";
import { getLocale } from "@/lib/i18n";
import { content, type Locale } from "@/lib/site/content";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  return {
    title: content[locale].metadata.title,
    description: content[locale].metadata.description,
  };
}

export default async function Page() {
  const locale = (await getLocale()) as Locale;
  return <HomePage locale={locale} />;
}
