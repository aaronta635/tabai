import { HomePage as FlootHomePage } from "@/components/marketing/pages/HomePage";
import { HomePage } from "@/components/site/pages/HomePage";
import { getLocale } from "@/lib/i18n";
import { flootMetadata } from "@/lib/marketing/metadata";
import { content, type Locale } from "@/lib/site/content";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  if (locale === "vi") return flootMetadata.home;
  return {
    title: content[locale].metadata.title,
    description: content[locale].metadata.description,
  };
}

export default async function Page() {
  const locale = (await getLocale()) as Locale;
  if (locale === "vi") return <FlootHomePage />;
  return <HomePage locale={locale} />;
}
