import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { LOCALE_COOKIE } from "../lib/constants";

export default getRequestConfig(async () => {
  const jar = await cookies();
  const locale = jar.get(LOCALE_COOKIE)?.value === "en" ? "en" : "vi";
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
