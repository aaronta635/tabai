import Link from "next/link";
import { getLocale, getMessages } from "@/lib/i18n";
import { getTeacherFromCookie, getStudentFromCookie } from "@/lib/auth";
import { LocaleToggle } from "@/components/locale-toggle";
import { BrandMark } from "@/components/landing/brand-mark";
import { BeatBar } from "@/components/landing/beat-bar";
import { TakePreview } from "@/components/landing/take-preview";
import { PieceCodeForm } from "@/components/landing/piece-code-form";
import { productOrigin } from "@/lib/sites";

export async function LandingPage() {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = messages.home;
  const teacher = await getTeacherFromCookie();
  const student = await getStudentFromCookie();
  const app = productOrigin();
  const signedInPath = teacher ? "/teacher" : student ? "/student" : "/auth";
  const tutorPath = teacher ? "/teacher" : "/auth?role=tutor";
  const studentPath = student ? "/student" : "/auth?role=student";
  const navHref = app ? `${app}${signedInPath}` : signedInPath;
  const tutorHref = app ? `${app}${tutorPath}` : tutorPath;
  const studentHref = app ? `${app}${studentPath}` : studentPath;

  return (
    <div className="landing">
      <header className="landing-nav">
        <Link href="/" aria-label={messages.brand}>
          <BrandMark priority />
        </Link>
        <div className="landing-nav-end">
          <LocaleToggle locale={locale} className="landing-locale" />
          <Link href={navHref} className="landing-cta landing-nav-cta">
            {teacher || student ? t.navOpen : t.navCta}
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-kicker">{t.eyebrow}</p>
          <h1 className="landing-title">
            <span>{t.titleLead}</span>
            <span className="landing-title-em">{t.titleEm}</span>
          </h1>
          <p className="landing-subhead">{t.subhead}</p>
          <div className="landing-actions">
            <Link href={tutorHref} className="landing-cta">
              {t.tutorCta}
            </Link>
            <Link href={studentHref} className="landing-cta">
              {t.studentCta}
            </Link>
            <p className="landing-hint">{t.demoHint}</p>
          </div>
        </div>
        <TakePreview piece={t.previewPiece} factA={t.previewFactA} factB={t.previewFactB} play={t.previewPlay} />
      </section>

      <BeatBar className="landing-beat" />

      <section className="landing-code">
        <p className="landing-code-label">{t.studentEntry}</p>
        <PieceCodeForm
          placeholder={t.codePlaceholder}
          submit={t.openPiece}
          variant="studio"
          productOrigin={app}
        />
      </section>

      <section id="how" className="landing-how">
        <p className="landing-kicker">{t.howKicker}</p>
        <h2 className="landing-how-title">{t.howTitle}</h2>
        <ol className="landing-staff">
          {[
            [t.how1Title, t.how1Body],
            [t.how2Title, t.how2Body],
            [t.how3Title, t.how3Body],
          ].map(([title, body], i) => (
            <li key={title} className="landing-measure">
              <span className="landing-barline" aria-hidden>
                {i + 1}
              </span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link href={tutorHref} className="landing-cta landing-cta-block">
          {t.tutorCta}
        </Link>
      </section>
    </div>
  );
}
