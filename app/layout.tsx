import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { I18nProvider, getLocale } from "@/lib/i18n";
import "./globals.css";

const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "howl0 — feedback for online guitar teachers",
  description: "One link for the group. Students send a take. howl0 lines it up with your score and tutorial.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={sans.variable}>
      <body className={`${sans.className} antialiased`}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
