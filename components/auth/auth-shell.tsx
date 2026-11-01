import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/landing/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Theme } from "@/lib/theme";

export function AuthShell({
  brand,
  manifesto,
  kicker,
  footer,
  theme,
  themeLabels,
  children,
}: {
  brand: string;
  manifesto: string;
  kicker: string;
  footer: string;
  theme: Theme;
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
          <h2>{manifesto}</h2>
          <p>{kicker}</p>
        </div>
        <p className="auth-brand-foot">{footer}</p>
      </section>
      <section className="auth-pane">
        <div className="auth-pane-tools">
          <ThemeToggle theme={theme} labels={themeLabels} />
        </div>
        {children}
      </section>
    </main>
  );
}
