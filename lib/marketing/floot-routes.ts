import type { Locale } from "@/lib/site/content";

/** Bare paths (no locale prefix) that use the Floot design in Vietnamese. */
const FLOOT_PATHS = ["/", "/product", "/how-it-works", "/faq"] as const;

export function usesFlootDesign(locale: Locale, barePath: string | null) {
  if (locale !== "vi" || !barePath) return false;
  const path = barePath.split("?")[0]?.replace(/\/+$/, "") || "/";
  return (FLOOT_PATHS as readonly string[]).includes(path);
}
