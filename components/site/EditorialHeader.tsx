import Link from "next/link";
import { content, homeHref, languageChoiceHref, localePath } from "@/lib/site/content";
import "@/styles/site/editorial-home.css";

/** The editorial homepage is English-only; the CTA opens the in-app signup. */
const SIGNUP_HREF = localePath("en", "/signup");

export function EditorialArrow() {
  return (
    <img
      src="/brand/para/homepage/arrow-right.svg"
      alt=""
      width={20}
      height={20}
    />
  );
}

export function EditorialCta() {
  return (
    <a className="ed-button" href={SIGNUP_HREF}>
      {content.en.conversion.button} <EditorialArrow />
    </a>
  );
}

export function EditorialHeader() {
  const navigation = content.en.navigation;
  return (
    <header className="ed-header">
      <nav className="ed-wrap ed-nav" aria-label={navigation.label}>
        <Link className="ed-brand" href={homeHref("en")} aria-label={navigation.homeLabel}>
          <img
            src="/brand/para/homepage/para-horizontal-black.svg"
            alt="PARA"
            width={1106}
            height={300}
          />
        </Link>
        <div className="ed-nav-actions">
          <a className="ed-nav-story ed-nav-anchor" href="#how-it-works">
            How it works
          </a>
          {/* Full navigation so the root layout re-renders with the new <html lang>. */}
          <a
            className="ed-nav-story ed-language"
            href={languageChoiceHref("vi", "/")}
            hrefLang="vi"
            lang="vi"
            aria-label={navigation.languageLabel}
          >
            {navigation.languageShort}
          </a>
          <EditorialCta />
        </div>
      </nav>
    </header>
  );
}
