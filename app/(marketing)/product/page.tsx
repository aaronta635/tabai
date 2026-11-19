import { ProductPage as FlootProductPage } from "@/components/marketing/pages/ProductPage";
import { ProductPage } from "@/components/site/pages/ProductPage";
import { getLocale } from "@/lib/i18n";
import { flootMetadata } from "@/lib/marketing/metadata";
import { content, type Locale } from "@/lib/site/content";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  if (locale === "vi") return flootMetadata.product;
  const page = content[locale].product;
  return { title: `${page.metadataTitle} — PARA`, description: page.intro };
}

export default async function Page() {
  const locale = (await getLocale()) as Locale;
  if (locale === "vi") return <FlootProductPage />;
  return <ProductPage locale={locale} />;
}
