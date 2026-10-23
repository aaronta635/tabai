import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/site/content";

export default async function Page() {
  const locale = (await getLocale()) as Locale;
  redirect(localePath(locale, "/for-you"));
}
