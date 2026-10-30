"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, useRef, useId } from "react";
import { BrandMark } from "@/components/landing/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { AvatarMark } from "@/components/profile/avatar-mark";
import { LocaleSwitch } from "@/components/locale-switch";
import { StudioTour, type TourCopy } from "@/components/studio/studio-tour";
import { createBrowserSupabase } from "@/lib/supabase/client";

import { ParaIcon, type ParaIconName } from "@/components/ui/para-icon";

export type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  icon?: ParaIconName;
};
export type MenuLink = { href: string; label: string };

const ActiveClassContext = createContext<(name: string | null) => void>(() => {});

function SignOutControl({ action, label }: { action: () => Promise<void>; label: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      className="studio-signout"
      disabled={pending}
      onClick={() => {
        setPending(true);
        sessionStorage.removeItem("howl0-session-bound");
        void (async () => {
          try {
            await createBrowserSupabase().auth.signOut({ scope: "local" });
          } catch {
            // The server action still expires the cookies.
          }
          await action();
        })();
      }}
    >
      {label}
    </button>
  );
}

export function ActiveClass({ name }: { name: string }) {
  const setName = useContext(ActiveClassContext);
  useEffect(() => {
    setName(name);
    return () => setName(null);
  }, [name, setName]);
  return null;
}

/**
 * Shared shell; student presentation and dialog behaviour are explicitly opted in.
 */
export function StudioShell({
  name,
  avatarSrc,
  theme,
  variant,
  home,
  kicker,
  items,
  menuLinks,
  signOutAction,
  tour,
  labels,
  children,
}: {
  name: string;
  avatarSrc?: string | null;
  theme?: "light" | "dark";
  variant?: "student";
  home: string;
  kicker: string;
  items: NavItem[];
  menuLinks: MenuLink[];
  signOutAction: () => Promise<void>;
  tour?: TourCopy;
  labels: {
    signOut: string;
    menu: string;
    close: string;
    themeLight: string;
    themeDark: string;
    language?: string;
    localeEn?: string;
    localeVi?: string;
  };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [railOpen, setRailOpen] = useState(false);
  const [activeClass, setActiveClass] = useState<string | null>(null);
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
        {activeClass ? <p className="studio-active-class">{activeClass}</p> : null}
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
              data-tour={item.href}
            >
              {variant === "student" && item.icon ? <ParaIcon name={item.icon} /> : null}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="studio-rail-foot">
        {labels.language && labels.localeEn && labels.localeVi ? (
          <LocaleSwitch labels={{ language: labels.language, en: labels.localeEn, vi: labels.localeVi }} />
        ) : null}
        {theme ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <ThemeToggle theme={theme} labels={{ light: labels.themeLight, dark: labels.themeDark }} />
          </div>
        ) : null}
        {profile ? (
          <Link href={profile.href} className="studio-profile" data-tour={profile.href}>
            <AvatarMark name={name} src={avatarSrc} />
            <span className="min-w-0">
              <span className="studio-profile-name block truncate">{name}</span>
              <span className="block truncate text-xs text-ink-soft">{profile.label}</span>
            </span>
          </Link>
        ) : (
          <p className="studio-profile-name px-1">{name}</p>
        )}
        <SignOutControl action={signOutAction} label={labels.signOut} />
      </div>
    </div>
  );

  return (
    <ActiveClassContext.Provider value={setActiveClass}>
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
          {labels.language && labels.localeEn && labels.localeVi ? (
            <LocaleSwitch labels={{ language: labels.language, en: labels.localeEn, vi: labels.localeVi }} />
          ) : null}
        </div>
        <main className="min-w-0 flex-1">
          <div className="studio-main px-4 py-6 lg:px-8 lg:py-7">
            {children}
          </div>
        </main>
      </div>
      {tour ? <StudioTour tour={tour} /> : null}
    </div>
    </ActiveClassContext.Provider>
  );
}
