import { EditorialHome } from "@/components/site/EditorialHome";
import { getLocale } from "@/lib/i18n";
import { content, type Locale } from "@/lib/site/content";
import { editorialCopy } from "@/lib/site/editorial-copy";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  return {
    title: content[locale].metadata.title,
    description: editorialCopy[locale].metaDescription,
  };
}

export default async function Page() {
  const locale = (await getLocale()) as Locale;
  // Both languages use the editorial homepage; copy comes from lib/site/editorial-copy.ts.
  return <EditorialHome locale={locale} />;
}
