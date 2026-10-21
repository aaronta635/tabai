import { cookies, headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages as getIntlMessages } from "next-intl/server";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";
import { LOCALE_COOKIE } from "@/lib/constants";
import { LOCALE_HEADER, localeFrom } from "@/lib/locale-path";

export async function getLocale() {
  const headerStore = await headers();
  const jar = await cookies();
  return localeFrom(headerStore.get(LOCALE_HEADER), jar.get(LOCALE_COOKIE)?.value);
}

export async function getMessages(locale: string) {
  return locale === "en" ? en : vi;
}

export async function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getIntlMessages();
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
