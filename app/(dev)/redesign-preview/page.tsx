import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RdButton } from "@/components/ui/rd-button";
import { RdCard } from "@/components/ui/rd-card";
import { RdField } from "@/components/ui/rd-field";
import { RD_ICONS, RdIcon, type RdIconName } from "@/components/ui/rd-icon";
import { getLocale } from "@/lib/i18n";
import { previewCopy } from "./copy";
import "@/styles/app/redesign-tokens.css";
import "@/styles/app/redesign-components.css";
import "./preview.css";

/**
 * PARA app redesign, phase 0: internal check page for IU and PM.
 * Not linked from any menu or sitemap, never indexed, and hidden on production.
 * Made-up text only: no student or teacher data.
 */
export const metadata: Metadata = {
  title: "Redesign preview",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

const COLOURS = [
  ["--rd-canvas", "#FFFFFF"],
  ["--rd-surface", "#F5F5F7"],
  ["--rd-ink", "#111111"],
  ["--rd-muted", "#626267"],
  ["--rd-line", "#DEDEE2"],
  ["--rd-field-border", "#8E8E93"],
  ["--rd-focus", "#38383C"],
  ["--rd-error", "#B42318"],
  ["--rd-sand", "#D6B98C"],
  ["--rd-sand-tint", "#F6EFE3"],
  ["--rd-sand-text", "#8B5E34"],
] as const;

export default async function RedesignPreviewPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const locale = await getLocale();
  const t = previewCopy[locale === "en" ? "en" : "vi"];

  return (
    <main className="para-rd rd-preview" lang={locale}>
      <div className="rd-preview__wrap">
        <header className="rd-preview__header">
          <p className="rd-preview__eyebrow">{t.eyebrow}</p>
          <h1 className="rd-preview__title">{t.title}</h1>
          <p className="rd-preview__intro">{t.intro}</p>
          <nav aria-label={t.languageNav} className="rd-preview__langs">
            <a href="/en/redesign-preview" aria-current={locale === "en" ? "page" : undefined}>
              English
            </a>
            <a href="/vi/redesign-preview" aria-current={locale === "vi" ? "page" : undefined}>
              Tiếng Việt
            </a>
          </nav>
        </header>

        <section className="rd-preview__section" aria-labelledby="rd-buttons">
          <h2 id="rd-buttons">{t.buttons.heading}</h2>
          <p className="rd-preview__note">{t.buttons.note}</p>
          <div className="rd-preview__grid">
            <div className="rd-preview__stack">
              <h3 className="rd-preview__label">{t.states.default}</h3>
              <RdButton>{t.buttons.primary}</RdButton>
              <RdButton variant="secondary">{t.buttons.secondary}</RdButton>
              <RdButton variant="ghost">{t.buttons.ghost}</RdButton>
            </div>
            <div className="rd-preview__stack">
              <h3 className="rd-preview__label">{t.states.disabled}</h3>
              <RdButton disabled>{t.buttons.primary}</RdButton>
              <RdButton variant="secondary" disabled>
                {t.buttons.secondary}
              </RdButton>
              <RdButton variant="ghost" disabled>
                {t.buttons.ghost}
              </RdButton>
            </div>
            <div className="rd-preview__stack">
              <h3 className="rd-preview__label">{t.states.loading}</h3>
              <RdButton loading loadingLabel={t.buttons.loadingLabel}>
                {t.buttons.primary}
              </RdButton>
              <RdButton variant="secondary" loading loadingLabel={t.buttons.loadingLabel}>
                {t.buttons.secondary}
              </RdButton>
            </div>
            <div className="rd-preview__stack">
              <h3 className="rd-preview__label">{t.states.withIcon}</h3>
              <RdButton icon="upload">{t.buttons.upload}</RdButton>
              <RdButton variant="secondary" icon="arrow-right" iconPosition="end">
                {t.buttons.next}
              </RdButton>
            </div>
          </div>
          <div className="rd-preview__narrow">
            <h3 className="rd-preview__label">{t.states.long}</h3>
            <RdButton block>{t.buttons.long}</RdButton>
          </div>
        </section>

        <section className="rd-preview__section" aria-labelledby="rd-fields">
          <h2 id="rd-fields">{t.fields.heading}</h2>
          <form className="rd-preview__grid" action="#" noValidate>
            <RdField label={t.fields.email} type="email" placeholder="name@example.com" hint={t.fields.emailHint} autoComplete="off" />
            <RdField label={t.fields.className} defaultValue={t.fields.classNameValue} />
            <RdField label={t.fields.password} type="password" defaultValue="short1" error={t.fields.passwordError} autoComplete="off" />
            <RdField label={t.fields.school} optionalLabel={t.fields.optional} placeholder={t.fields.schoolPlaceholder} />
            <RdField label={t.fields.joinCode} hint={t.fields.joinCodeHint} placeholder="ABC123" />
            <RdField label={t.fields.email} type="email" defaultValue="teacher@example.com" disabled hint={t.fields.disabledHint} />
          </form>
        </section>

        <section className="rd-preview__section" aria-labelledby="rd-cards">
          <h2 id="rd-cards">{t.cards.heading}</h2>
          <p className="rd-preview__note">{t.cards.note}</p>
          <div className="rd-preview__grid">
            <RdCard title={t.cards.teacherTitle}>{t.cards.teacherBody}</RdCard>
            <RdCard title={t.cards.studentTitle} selected selectedLabel={t.cards.selected}>
              {t.cards.studentBody}
            </RdCard>
          </div>
        </section>

        <section className="rd-preview__section" aria-labelledby="rd-icons">
          <h2 id="rd-icons">{t.icons.heading}</h2>
          <ul className="rd-preview__icons">
            {(Object.keys(RD_ICONS) as RdIconName[]).map((name) => (
              <li key={name}>
                <RdIcon name={name} size={24} />
                <code>{name}</code>
              </li>
            ))}
          </ul>
        </section>

        <section className="rd-preview__section" aria-labelledby="rd-colours">
          <h2 id="rd-colours">{t.colours.heading}</h2>
          <p className="rd-preview__note">{t.colours.note}</p>
          <ul className="rd-preview__swatches">
            {COLOURS.map(([name, hex]) => (
              <li key={name}>
                <span className="rd-preview__swatch" style={{ background: `var(${name})` }} aria-hidden="true" />
                <code>{name}</code>
                <span>{hex}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
