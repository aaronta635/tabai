"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ParaIcon } from "@/components/site/ParaIcon";
import { content, homeHref, languageChoiceHref, localePath, type Locale } from "@/lib/site/content";
import { authPath } from "@/lib/return-path";
import "@/styles/site/editorial-home.css";

/** "Try for free" opens teacher signup (/en/signup/teacher, /vi/signup/teacher). */
export function teacherSignupHref(locale: Locale) {
  return localePath(locale, authPath("signup", "tutor"));
}
/** Matches the CSS breakpoint where the inline links give way to the menu. */
const MENU_QUERY = "(max-width: 760px)";

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

export function EditorialCta({ locale = "en", onClick }: { locale?: Locale; onClick?: () => void }) {
  return (
    <a className="ed-button" href={teacherSignupHref(locale)} onClick={onClick}>
      {content.en.conversion.button} <EditorialArrow />
    </a>
  );
}

export function EditorialHeader() {
  const navigation = content.en.navigation;
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const surfaces = Array.from(
      document.querySelectorAll<HTMLElement>(".para-site main, .para-site > footer"),
    );
    const previous = surfaces.map((node) => node.inert);
    const overflow = document.body.style.overflow;
    surfaces.forEach((node) => {
      node.inert = true;
    });
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      surfaces.forEach((node, index) => {
        node.inert = previous[index];
      });
      document.body.style.overflow = overflow;
    };
  }, [open]);

  useEffect(() => {
    const media = matchMedia(MENU_QUERY);
    const resize = () => {
      if (!media.matches) setOpen(false);
    };
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);

  function close(restoreFocus: boolean) {
    setOpen(false);
    if (restoreFocus) toggle.current?.focus();
  }

  function handleKeys(event: React.KeyboardEvent<HTMLElement>) {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key !== "Tab") return;
    // The open menu is modal: Tab cycles through the toggle and the panel only.
    const items = [
      toggle.current,
      ...Array.from(panel.current?.querySelectorAll<HTMLElement>("a,button") ?? []),
    ].filter((node): node is HTMLElement => !!node && node.getClientRects().length > 0);
    const index = items.indexOf(document.activeElement as HTMLElement);
    const direction = event.shiftKey ? -1 : 1;
    event.preventDefault();
    items[(index + direction + items.length) % items.length]?.focus();
  }

  return (
    <header className={open ? "ed-header ed-menu-open" : "ed-header"} onKeyDown={handleKeys}>
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
          <a className="ed-nav-story ed-nav-inline" href="#how-it-works">
            How it works
          </a>
          {/* Full navigation so the root layout re-renders with the new <html lang>. */}
          <a
            className="ed-nav-story ed-language ed-nav-inline"
            href={languageChoiceHref("vi", "/")}
            hrefLang="vi"
          >
            <span lang="vi">{navigation.languageShort}</span>
            <span className="sr-only"> {navigation.languageLabel}</span>
          </a>
          <EditorialCta />
          <button
            ref={toggle}
            type="button"
            className="ed-menu-toggle"
            aria-expanded={open}
            aria-controls="ed-menu"
            onClick={() => (open ? close(false) : setOpen(true))}
          >
            <span className="sr-only">{open ? navigation.close : navigation.menu}</span>
            <ParaIcon name={open ? "close" : "menu"} />
          </button>
        </div>
      </nav>
      <div
        id="ed-menu"
        ref={panel}
        className="ed-menu"
        hidden={!open}
      >
        <div className="ed-wrap ed-menu-inner">
          {navigation.items.map(([label, url]) => (
            <Link
              key={url}
              className="ed-menu-link"
              href={localePath("en", url)}
              prefetch={false}
              onClick={() => close(false)}
            >
              {label}
            </Link>
          ))}
          <div className="ed-menu-language" role="group" aria-label={navigation.languageGroup}>
            <a href={languageChoiceHref("en", "/")} hrefLang="en" aria-current="true">
              EN
            </a>
            <a href={languageChoiceHref("vi", "/")} hrefLang="vi">
              <span lang="vi">VI</span>
              <span className="sr-only"> {navigation.languageLabel}</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
