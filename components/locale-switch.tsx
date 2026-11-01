"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { splitLocale, withLocale, type Locale } from "@/lib/locale-path";

export function LocaleSwitch({
  labels,
  className = "locale-switch",
}: {
  labels: { language: string; en: string; vi: string };
  className?: string;
}) {
  const pathname = usePathname();
  const split = splitLocale(pathname);
  const current: Locale = split.locale ?? "vi";
  return (
    <div className={className} role="group" aria-label={labels.language}>
      {(["en", "vi"] as const).map((locale) => (
        <Link
          key={locale}
          href={withLocale(split.pathname, locale)}
          hrefLang={locale}
          lang={locale}
          aria-current={current === locale ? "true" : undefined}
        >
          {labels[locale]}
        </Link>
      ))}
    </div>
  );
}
