"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/landing/brand-mark";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { initialsOf } from "@/lib/initials";

export type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  badge?: number;
  countsUrl?: string;
};
export type MenuLink = { href: string; label: string };

/**
 * One shell for both sides of the studio: full-width top bar, dark rail, folded pages.
 * Teacher and student differ only in their nav items and menu links.
 */
export function StudioShell({
  name,
  locale,
  theme,
  home,
  items,
  menuLinks,
  signOutAction,
  labels,
  children,
}: {
  name: string;
  locale: string;
  theme: "light" | "dark";
  home: string;
  items: NavItem[];
  menuLinks: MenuLink[];
  signOutAction: () => Promise<void>;
  labels: { signOut: string; menu: string; close: string; themeLight: string; themeDark: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [railOpen, setRailOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    setRailOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Refreshing the cookie once per tab is enough; it used to run on every navigation.
  useEffect(() => {
    if (sessionStorage.getItem("howl0-session-bound")) return;
    sessionStorage.setItem("howl0-session-bound", "1");
    void fetch("/api/session", { method: "POST" });
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const countUrls = items.map((item) => item.countsUrl).filter(Boolean).join("|");
  useEffect(() => {
    const urls = countUrls.split("|").filter(Boolean);
    urls.forEach((url) => {
      const cached = sessionStorage.getItem(`howl0-badge:${url}`);
      if (cached) {
        setBadges((current) => ({ ...current, [url]: Number(cached) || 0 }));
      }
      const freshAt = Number(sessionStorage.getItem(`howl0-badge-at:${url}`) ?? 0);
      if (Date.now() - freshAt < 20_000 && cached) return;
      void fetch(url)
        .then((res) => res.json() as Promise<{ unanswered?: number; waiting?: number }>)
        .then((data) => {
          const value = Number(data.unanswered ?? data.waiting ?? 0);
          sessionStorage.setItem(`howl0-badge:${url}`, String(value));
          sessionStorage.setItem(`howl0-badge-at:${url}`, String(Date.now()));
          setBadges((current) => ({ ...current, [url]: value }));
        })
        .catch(() => undefined);
    });
  }, [countUrls]);

  function active(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const rail = (
    <div className="flex h-full flex-col px-3 pb-6 pt-5">
      <Link href={home} className="mb-7 inline-flex px-2" aria-label="howl0">
        <BrandMark light compact />
      </Link>
      <nav className="font-ui flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const on = active(item.href, item.exact);
          const badge = item.countsUrl ? (badges[item.countsUrl] ?? 0) : (item.badge ?? 0);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              aria-current={on ? "page" : undefined}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${
                on ? "bg-white/15 text-white" : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{item.label}</span>
              {badge ? (
                <span className="tabular rounded-full bg-butter px-2 py-0.5 text-[11px] font-medium text-void">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="studio-shell flex min-h-dvh flex-col">
      <header className="studio-top">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="font-ui rounded-full px-2 py-1 text-lg leading-none text-ink lg:hidden"
            aria-label={labels.menu}
            onClick={() => setRailOpen(true)}
          >
            ☰
          </button>
          <Link href={home} aria-label="howl0">
            <BrandMark />
          </Link>
        </div>

        <div className="studio-top-end">
          <ThemeToggle theme={theme} labels={{ light: labels.themeLight, dark: labels.themeDark }} />
          <LocaleToggle locale={locale} />
          <div className="relative">
            <button
              type="button"
              className="avatar-btn font-ui"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={name}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {initialsOf(name)}
            </button>
            {menuOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label={labels.close}
                  onClick={() => setMenuOpen(false)}
                />
                <div className="avatar-menu font-ui" role="menu">
                  <p className="avatar-name">{name}</p>
                  {menuLinks.map((link) => (
                    <Link key={link.href} href={link.href} role="menuitem">
                      {link.label}
                    </Link>
                  ))}
                  <form action={signOutAction}>
                    <button type="submit" role="menuitem" className="text-ink-soft">
                      {labels.signOut}
                    </button>
                  </form>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="studio-rail hidden w-56 shrink-0 lg:block">{rail}</aside>

        {railOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-void/45"
              aria-label={labels.close}
              onClick={() => setRailOpen(false)}
            />
            <aside className="studio-rail relative h-full w-64 max-w-[80vw] shadow-2xl">
              <div className="flex justify-end px-3 pt-3">
                <button
                  type="button"
                  className="font-ui rounded-full px-3 py-1 text-sm text-white/70"
                  onClick={() => setRailOpen(false)}
                >
                  {labels.close}
                </button>
              </div>
              {rail}
            </aside>
          </div>
        ) : null}

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl px-4 py-8 lg:px-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
