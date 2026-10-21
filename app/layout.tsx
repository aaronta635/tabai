import type { Metadata } from "next";
import localFont from "next/font/local";
import { I18nProvider, getLocale } from "@/lib/i18n";
import { getTheme } from "@/lib/theme";
import "./globals.css";

const headline = localFont({
  src: "../public/fonts/PlusJakartaSans-wght.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-serif",
});

const body = localFont({
  src: [
    { path: "../public/fonts/BeVietnamPro-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/BeVietnamPro-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/BeVietnamPro-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PARA — feedback for online guitar teachers",
  description: "One link for the group. Students send a take. PARA lines it up with your score and tutorial.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const theme = await getTheme();
  return (
    <html
      lang={locale}
      data-theme={theme}
      className={`${headline.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
