import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { LOCALE_COOKIE } from "../lib/constants";
import { LOCALE_HEADER, localeFrom } from "../lib/locale-path";

export default getRequestConfig(async () => {
  const headerStore = await headers();
  const jar = await cookies();
  const locale = localeFrom(headerStore.get(LOCALE_HEADER), jar.get(LOCALE_COOKIE)?.value);
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
