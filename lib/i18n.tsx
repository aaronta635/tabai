import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages as getIntlMessages } from "next-intl/server";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";
import { LOCALE_COOKIE } from "@/lib/constants";

export async function getLocale() {
  const jar = await cookies();
  return jar.get(LOCALE_COOKIE)?.value === "en" ? "en" : "vi";
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
