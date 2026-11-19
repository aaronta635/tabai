import { HowItWorksPage as FlootHowItWorksPage } from "@/components/marketing/pages/HowItWorksPage";
import { HowItWorksPage } from "@/components/site/pages/HowItWorksPage";
import { getLocale } from "@/lib/i18n";
import { flootMetadata } from "@/lib/marketing/metadata";
import { content, type Locale } from "@/lib/site/content";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  if (locale === "vi") return flootMetadata.howItWorks;
  const page = content[locale].howItWorks;
  return { title: `${page.metadataTitle} — PARA`, description: page.intro };
}

export default async function Page() {
  const locale = (await getLocale()) as Locale;
  if (locale === "vi") return <FlootHowItWorksPage />;
  return <HowItWorksPage locale={locale} />;
}
