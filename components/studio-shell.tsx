"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef, useId } from "react";
import { BrandMark } from "@/components/landing/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { initialsOf } from "@/lib/initials";

import { ParaIcon, type ParaIconName } from "@/components/ui/para-icon";

export type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  icon?: ParaIconName;
};
export type MenuLink = { href: string; label: string };

function StudioSearch({ action, placeholder, student = false }: { action: string; placeholder: string; student?: boolean }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const searchQuery = params.get("q") ?? "";
  return (
    <form action={action} className="studio-search" method="get">
      {student ? <ParaIcon name="search" /> : null}
      <input
        key={`${pathname}:${searchQuery}`}
        name="q"
        defaultValue={searchQuery}
        placeholder={placeholder}
        aria-label={placeholder}
        className="field"
      />
    </form>
  );
}

/**
 * Shared shell; student presentation and dialog behaviour are explicitly opted in.
 */
export function StudioShell({
  name,
  theme,
  variant,
  home,
  kicker,
  items,
  menuLinks,
  signOutAction,
  search,
  labels,
  children,
}: {
  name: string;
  theme?: "light" | "dark";
  variant?: "student";
  home: string;
  kicker: string;
  items: NavItem[];
  menuLinks: MenuLink[];
  signOutAction: () => Promise<void>;
  search?: { action: string; placeholder: string };
  labels: { signOut: string; menu: string; close: string; themeLight: string; themeDark: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [railOpen, setRailOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const drawerId = useId();

  useEffect(() => {
    if (variant !== "student" || !railOpen) return;
    const drawer = drawerRef.current;
    const content = contentRef.current;
    const overflow = document.body.style.overflow;
    const wasInert = content?.inert ?? false;
    if (content) content.inert = true;
    document.body.style.overflow = "hidden";
    drawer?.querySelector<HTMLButtonElement>("button")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setRailOpen(false);
      if (event.key !== "Tab" || !drawer) return;
      const targets = Array.from(drawer.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled)')).filter((node) => node.getClientRects().length);
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { if (desktop.matches) setRailOpen(false); };
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      if (content) content.inert = wasInert;
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
      menuRef.current?.focus();
    };
  }, [railOpen, variant]);

  useEffect(() => {
    setRailOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (sessionStorage.getItem("howl0-session-bound")) return;
    sessionStorage.setItem("howl0-session-bound", "1");
    void fetch("/api/session", { method: "POST" });
  }, []);

  const here = pathname.replace(/^\/(vi|en)(?=\/|$)/, "") || "/";

  function active(href: string, exact?: boolean) {
    if (exact) return here === href;
    return here === href || here.startsWith(`${href}/`);
  }

  const profile = menuLinks[0];

  const rail = (
    <div className="flex h-full flex-col px-3 pb-4 pt-5">
      <div className="mb-6 px-2">
        <Link href={home} className="inline-flex" aria-label="PARA">
          <BrandMark />
        </Link>
        <p className="studio-kicker">{kicker}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5">
        {items.map((item) => {
          const on = active(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              aria-current={on ? "page" : undefined}
              className="studio-nav-link"
            >
              {variant === "student" && item.icon ? <ParaIcon name={item.icon} /> : null}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="studio-rail-foot">
        {theme ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <ThemeToggle theme={theme} labels={{ light: labels.themeLight, dark: labels.themeDark }} />
          </div>
        ) : null}
        {profile ? (
          <Link href={profile.href} className="studio-profile">
            <span className="avatar-btn" aria-hidden>
              {initialsOf(name)}
            </span>
            <span className="min-w-0">
              <span className="studio-profile-name block truncate">{name}</span>
              <span className="block truncate text-xs text-ink-soft">{profile.label}</span>
            </span>
          </Link>
        ) : (
          <p className="studio-profile-name px-1">{name}</p>
        )}
        <form action={signOutAction}>
          <button type="submit" className="studio-signout">
            {labels.signOut}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className={`studio-shell flex min-h-dvh${variant === "student" ? " student-ui" : ""}`}>
      <aside className="studio-rail hidden w-60 shrink-0 lg:block">{rail}</aside>

      {railOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role={variant === "student" ? "dialog" : undefined} aria-modal={variant === "student" ? true : undefined} aria-label={variant === "student" ? labels.menu : undefined}>
          <button
            type="button"
            className={`absolute inset-0 bg-void/40${variant === "student" ? " student-nav-backdrop" : ""}`}
            aria-label={labels.close}
            onClick={() => setRailOpen(false)}
          />
          <aside ref={drawerRef} id={drawerId} className="studio-rail relative h-full w-64 max-w-[80vw]">
            <div className="flex justify-end px-3 pt-3">
              <button type="button" className="studio-signout" onClick={() => setRailOpen(false)}>
                {variant === "student" ? <ParaIcon name="close" /> : null}
                {labels.close}
              </button>
            </div>
            {rail}
          </aside>
        </div>
      ) : null}

      <div ref={contentRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="studio-mobile-bar lg:hidden">
          <button ref={menuRef} type="button" className="studio-menu" aria-label={labels.menu} aria-expanded={variant === "student" ? railOpen : undefined} aria-controls={variant === "student" && railOpen ? drawerId : undefined} onClick={() => setRailOpen(true)}>
            {variant === "student" ? <ParaIcon name="menu" /> : "☰"}
          </button>
          <Link href={home} aria-label="PARA">
            <BrandMark compact />
          </Link>
        </div>
        <main className="min-w-0 flex-1">
          <div className="studio-main px-4 py-6 lg:px-8 lg:py-7">
            {search ? (
              <Suspense
                fallback={
                  <form action={search.action} className="studio-search" method="get">
                    {variant === "student" ? <ParaIcon name="search" /> : null}
                    <input name="q" placeholder={search.placeholder} aria-label={search.placeholder} className="field" />
                  </form>
                }
              >
                <StudioSearch action={search.action} placeholder={search.placeholder} student={variant === "student"} />
              </Suspense>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
