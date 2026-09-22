import type { Metadata } from "next";
import { Be_Vietnam_Pro, Charis_SIL } from "next/font/google";
import { I18nProvider, getLocale } from "@/lib/i18n";
import { getTheme } from "@/lib/theme";
import "./globals.css";

const serif = Charis_SIL({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const ui = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "howl0 — feedback for online guitar teachers",
  description: "One link for the group. Students send a take. howl0 lines it up with your score and tutorial.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const theme = await getTheme();
  return (
    <html
      lang={locale}
      data-theme={theme}
      className={`${serif.variable} ${ui.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
