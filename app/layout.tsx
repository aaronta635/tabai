import type { Metadata } from "next";
import { Be_Vietnam_Pro, DM_Sans, IBM_Plex_Serif, Instrument_Serif } from "next/font/google";
import { I18nProvider, getLocale } from "@/lib/i18n";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const viet = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-viet",
});

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
});

const displayVi = IBM_Plex_Serif({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display-vi",
});

export const metadata: Metadata = {
  title: "nhận xét — feedback for online guitar teachers",
  description: "A teacher posts one link. Students send a take. Nobody is left unanswered.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${sans.variable} ${viet.variable} ${display.variable} ${displayVi.variable}`}
    >
      <body className="antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
