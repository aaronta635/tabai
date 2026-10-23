import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  intro,
  children,
  tone = "light",
}: {
  eyebrow: string;
  title: ReactNode;
  intro: string;
  children?: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <header
      className={`page-hero page-hero-${tone} surface-noise`}
      aria-labelledby="page-title"
    >
      <div className="wrap page-hero-grid">
        <div className="page-hero-copy">
          <p className={`eyebrow ${tone === "dark" ? "light" : ""}`}>
            {eyebrow}
          </p>
          <h1 id="page-title">{title}</h1>
          <p>{intro}</p>
        </div>
        {children ? <div className="page-hero-art">{children}</div> : null}
      </div>
    </header>
  );
}
