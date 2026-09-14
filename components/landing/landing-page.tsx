import Link from "next/link";
import { getLocale, getMessages } from "@/lib/i18n";
import { requireTeacher } from "@/lib/auth";
import { LocaleToggle } from "@/components/locale-toggle";
import { BrandMark } from "@/components/landing/brand-mark";
import { PieceCodeForm } from "@/components/landing/piece-code-form";

const HERO =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=2400&q=80";

export async function LandingPage() {
  const locale = await getLocale();
  const t = (await getMessages(locale)).home;
  const teacher = await requireTeacher().catch(() => null);
  const demoHref = teacher ? "/teacher/pieces" : "/auth?next=/teacher/pieces";

  return (
    <div className="landing bg-[#f4f1ea] text-[#141210]">
      <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <nav className="pointer-events-auto flex items-center rounded-full bg-white/80 p-1 shadow-[0_8px_30px_rgba(20,18,16,0.08)] ring-1 ring-black/5 backdrop-blur-md">
          <Link href="/" className="rounded-full bg-white py-1 pl-1 pr-4" aria-label="nhận xét">
            <BrandMark />
          </Link>
          <Link
            href={demoHref}
            className="rounded-full bg-[#141210] px-4 py-2 text-sm font-medium text-white"
          >
            {t.demoCta}
          </Link>
          <LocaleToggle locale={locale} className="ml-0.5" />
        </nav>
      </header>

      <section className="relative isolate min-h-[85dvh] overflow-hidden">
        <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 mx-auto flex min-h-[85dvh] max-w-2xl flex-col items-center justify-center px-6 pb-28 pt-24 text-center text-white">
          <p className="text-sm text-white/80">{t.eyebrow}</p>
          <h1 className="font-display mt-4 text-[2.6rem] leading-[1.05] tracking-tight md:text-6xl">
            {t.titleLead}
            <br />
            <em className="italic">{t.titleEm}</em>
          </h1>
          <p className="mt-5 text-lg text-white/90">{t.subhead}</p>
          <Link
            href={demoHref}
            className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-medium text-[#141210]"
          >
            {t.demoCta}
          </Link>
          <p className="mt-3 text-sm text-white/70">{t.demoHint}</p>
        </div>
        <div className="absolute inset-x-0 bottom-6 z-10 px-4">
          <div className="mx-auto max-w-xl">
            <p className="mb-2 text-center text-xs text-white/70">{t.studentEntry}</p>
            <PieceCodeForm placeholder={t.codePlaceholder} submit={t.openPiece} variant="hero" />
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-2xl px-5 py-16">
        <h2 className="font-display text-center text-3xl">{t.howTitle}</h2>
        <ol className="mt-10 space-y-8">
          {[
            [t.how1Title, t.how1Body],
            [t.how2Title, t.how2Body],
            [t.how3Title, t.how3Body],
          ].map(([title, body], i) => (
            <li key={title} className="grid grid-cols-[auto_1fr] gap-4">
              <span className="font-display text-2xl text-[#6b6560]">{i + 1}</span>
              <div>
                <h3 className="font-display text-xl">{title}</h3>
                <p className="mt-1 text-[#6b6560]">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-12 rounded-3xl bg-[#141210] px-6 py-8 text-center text-white">
          <p className="text-sm text-white/70">{t.demoHere}</p>
          <Link href={demoHref} className="font-display mt-2 inline-block text-3xl">
            {t.demoCta}
          </Link>
        </div>
      </section>
    </div>
  );
}
