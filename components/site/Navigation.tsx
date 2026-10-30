"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/site/BrandLogo";
import { ParaIcon } from "@/components/site/ParaIcon";
import { ProductCta } from "@/components/site/ProductCta";
import {
  content,
  homeHref,
  languageChoiceHref,
  localePath,
  type Locale,
} from "@/lib/site/content";

export function Navigation({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [hash, setHash] = useState("");
  const pathname = usePathname();
  const dictionary = content[locale].navigation;
  const toggle = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const navigation = useRef<HTMLElement>(null);

  useEffect(() => {
    const update = () =>
      setHash(window.location.hash === "#waitlist" ? "#waitlist" : "");
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [pathname]);

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
    firstLink.current?.focus();
    return () => {
      surfaces.forEach((node, index) => {
        node.inert = previous[index];
      });
      document.body.style.overflow = overflow;
    };
  }, [open]);

  useEffect(() => {
    const media = matchMedia("(min-width: 1281px)");
    const resize = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);

  const plainPath = pathname.replace(/^\/(vi|en)(?=\/|$)/, "") || "/";
  const languageHash = plainPath === "/" ? hash : "";

  function handleKeys(event: React.KeyboardEvent<HTMLElement>) {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      toggle.current?.focus();
      return;
    }
    if (event.key !== "Tab") return;
    const links = Array.from(
      navigation.current!.querySelectorAll<HTMLElement>("a,button"),
    ).filter((node) => node.getClientRects().length);
    // Explicit traversal also includes anchors when Safari's keyboard setting
    // would otherwise skip links. The modal menu owns focus while it is open.
    const index = links.indexOf(document.activeElement as HTMLElement);
    const direction = event.shiftKey ? -1 : 1;
    event.preventDefault();
    links[(index + direction + links.length) % links.length]?.focus();
  }

  return (
    <header className="site-header integrated-header">
      <nav
        ref={navigation}
        className="nav"
        aria-label={dictionary.label}
        onKeyDown={handleKeys}
      >
        <a
          className="brand"
          href={homeHref(locale)}
          aria-label={dictionary.homeLabel}
        >
          <BrandLogo width={120} height={59} />
        </a>
        <div id="nav-links" className={open ? "nav-links open" : "nav-links"}>
          {dictionary.items.map(([label, url], index) => {
            const href = localePath(locale, url);
            return (
              <Link
                key={url}
                ref={index === 0 ? firstLink : undefined}
                href={href}
                prefetch={false}
                aria-current={pathname === href ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            );
          })}
          <ProductCta
            locale={locale}
            size="compact"
            className="nav-cta"
            onClick={() => setOpen(false)}
          />
        </div>
        <div className="language-switch" role="group" aria-label={dictionary.languageLabel}>
          {(["en", "vi"] as const).map((choice) => (
            <a
              key={choice}
              href={languageChoiceHref(choice, plainPath, languageHash)}
              hrefLang={choice}
              lang={choice}
              aria-current={locale === choice ? "true" : undefined}
              onClick={() => setOpen(false)}
            >
              {choice === "en" ? "EN" : "VI"}
            </a>
          ))}
        </div>
        <button
          ref={toggle}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="nav-links"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">
            {open ? dictionary.close : dictionary.menu}
          </span>
          <ParaIcon name={open ? "close" : "menu"} />
        </button>
      </nav>
    </header>
  );
}
