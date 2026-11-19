import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "@/styles/site/para.css";
import "@/styles/site/marketing-tokens.css";
import { SiteShell } from "@/components/marketing/SiteShell";
import { SiteFrame } from "@/components/site/site-frame";
import { getLocale } from "@/lib/i18n";
import { usesFlootDesign } from "@/lib/marketing/floot-routes";
import { RETURN_PATH_HEADER } from "@/lib/return-path";
import type { Locale } from "@/lib/site/content";

const inter = Inter({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-marketing-inter",
});

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale;
  const barePath = (await headers()).get(RETURN_PATH_HEADER);
  if (usesFlootDesign(locale, barePath)) {
    return (
      <div className={`para-marketing ${inter.variable}`} lang={locale}>
        <SiteShell>{children}</SiteShell>
      </div>
    );
  }
  return <SiteFrame locale={locale}>{children}</SiteFrame>;
}
