import "@/styles/site/para.css";
import { SiteFrame } from "@/components/site/site-frame";
import { getLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/site/content";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale;
  return <SiteFrame locale={locale}>{children}</SiteFrame>;
}
