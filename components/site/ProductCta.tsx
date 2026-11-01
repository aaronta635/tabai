import type { MouseEventHandler } from "react";
import { content, localePath, type Locale } from "@/lib/site/content";
import { ParaIcon } from "@/components/site/ParaIcon";

/** The anchor is stationary; only its decorative material responds to input. */
export function ProductCta({
  locale,
  size = "regular",
  tone = "espresso",
  className = "",
  compartment = false,
  onClick,
}: {
  locale: Locale;
  size?: "compact" | "regular" | "large";
  tone?: "espresso" | "ivory";
  className?: string;
  compartment?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <a
      href={localePath(locale, "/signup")}
      className={`product-cta ${className}`}
      data-size={size}
      data-tone={tone}
      onClick={onClick}
    >
      <span className="product-cta-material" aria-hidden="true">
        <span className="product-cta-gradient" />
        <span className="product-cta-glass" />
        <span className="product-cta-grain" />
        <span className="product-cta-edge" />
      </span>
      <span className="product-cta-label">
        {content[locale].conversion.button}
      </span>
      {compartment ? (
        <span className="product-cta-compartment" aria-hidden="true">
          <ParaIcon name="arrow-right" />
        </span>
      ) : (
        <ParaIcon name="arrow-right" />
      )}
    </a>
  );
}
