"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/site/BrandLogo";
import { content, homeHref, localePath, type Locale } from "@/lib/site/content";
import { ProductCta } from "@/components/site/ProductCta";

export function SiteFooter({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const dictionary = content[locale];
  // The homepage owns its final scene; secondary routes retain their footer.
  if (pathname === "/" || pathname === "/vi" || pathname === "/vi/" || pathname === "/en" || pathname === "/en/")
    return null;
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-main">
          <div>
            <a
              href={homeHref(locale)}
              aria-label={dictionary.navigation.homeLabel}
            >
              <BrandLogo width={168} height={83} footer />
            </a>
            <p>{dictionary.footer.belief}</p>
          </div>
          <nav
            className="footer-links"
            aria-label={dictionary.footer.navigationLabel}
          >
            {dictionary.navigation.items.map(([label, href]) => (
              <Link href={localePath(locale, href)} key={href} prefetch={false}>
                {label}
              </Link>
            ))}
            <ProductCta locale={locale} size="compact" tone="ivory" />
          </nav>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} PARA ·{" "}
            {dictionary.footer.pronunciation}
          </span>
          <nav className="footer-legal" aria-label={dictionary.footer.legalLabel}>
            {dictionary.footer.legal.map(([label, href]) => (
              <Link href={localePath(locale, href)} key={href} prefetch={false}>
                {label}
              </Link>
            ))}
          </nav>
          <span>
            {dictionary.footer.status} ·{" "}
            <a href={`mailto:${dictionary.footer.contact}`}>{dictionary.footer.contact}</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
