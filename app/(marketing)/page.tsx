import { EditorialHome } from "@/components/site/EditorialHome";
import { HomePage } from "@/components/site/pages/HomePage";
import { getLocale } from "@/lib/i18n";
import { content, type Locale } from "@/lib/site/content";

/** English homepage copy from the editorial design (howl0-landing). */
const EDITORIAL_DESCRIPTION =
  "Share a practice take, hear from your teacher, and know what to try next with PARA Music.";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  return {
    title: content[locale].metadata.title,
    description: locale === "en" ? EDITORIAL_DESCRIPTION : content[locale].metadata.description,
  };
}

export default async function Page() {
  const locale = (await getLocale()) as Locale;
  // English uses the editorial homepage; Vietnamese keeps the scene-based homepage.
  return locale === "en" ? <EditorialHome /> : <HomePage locale={locale} />;
}
