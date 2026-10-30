"use client";

import { usePathname } from "next/navigation";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";
import { splitLocale } from "@/lib/locale-path";

/** Nav copy follows the address. The studio layout is reused across /en and /vi, so server labels stay on the first language. The server render uses the request locale when the rewritten path has no prefix. */
export function useStudioMessages(fallback: "en" | "vi") {
  const pathname = usePathname();
  const fromPath = splitLocale(pathname).locale;
  const locale = fromPath ?? fallback;
  return locale === "en" ? en : vi;
}
