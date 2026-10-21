import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/landing/brand-mark";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Theme } from "@/lib/theme";

export function AuthShell({
  brand,
  manifesto,
  kicker,
  footer,
  theme,
  locale,
  themeLabels,
  children,
}: {
  brand: string;
  manifesto: string;
  kicker: string;
  footer: string;
  theme: Theme;
  locale: string;
  themeLabels: { light: string; dark: string };
  children: ReactNode;
}) {
  return (
    <main className="auth-split">
      <section className="auth-brand">
        <Link href="/" className="auth-logo" aria-label={brand}>
          <BrandMark light priority />
        </Link>
        <div className="auth-brand-copy">
          <div className="auth-staff" aria-hidden />
          <h2>{manifesto}</h2>
          <p>{kicker}</p>
        </div>
        <p className="auth-brand-foot">{footer}</p>
      </section>
      <section className="auth-pane">
        <div className="auth-pane-tools">
          <ThemeToggle theme={theme} labels={themeLabels} />
          <LocaleToggle locale={locale} />
        </div>
        {children}
      </section>
    </main>
  );
}
