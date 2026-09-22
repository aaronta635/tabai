import { cookies } from "next/headers";
import { THEME_COOKIE } from "@/lib/constants";

export type Theme = "light" | "dark";

export async function getTheme(): Promise<Theme> {
  const jar = await cookies();
  return jar.get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";
}
