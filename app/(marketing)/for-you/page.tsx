import { ForYouPage } from "@/components/site/pages/ForYouPage";
import { getLocale } from "@/lib/i18n";
import { content, type Locale } from "@/lib/site/content";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  const page = content[locale].forYou;
  return { title: `${page.metadataTitle} — PARA`, description: page.intro };
}

export default async function Page() {
  const locale = (await getLocale()) as Locale;
  return <ForYouPage locale={locale} />;
}
