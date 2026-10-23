import Link from "next/link";
import { BrandLogo } from "@/components/site/BrandLogo";
import { content, homeHref, localePath, type Locale } from "@/lib/site/content";

export function SiteFooter({ locale }: { locale: Locale }) {
  const dictionary = content[locale];
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
            <a href={homeHref(locale, "#waitlist")}>
              {dictionary.navigation.waitlist}
            </a>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} PARA ·{" "}
            {dictionary.footer.pronunciation}
          </span>
          <span>
            {dictionary.footer.status} · {dictionary.footer.contact}
          </span>
        </div>
      </div>
    </footer>
  );
}
