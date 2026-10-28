import Link from "next/link";
import { PageHero } from "@/components/site/PageHero";
import { LEGAL_EMAIL, type LegalDocument } from "@/lib/site/legal";
import { localePath, type Locale } from "@/lib/site/content";

const LINKED = [LEGAL_EMAIL, "/privacy", "/terms", "/data-deletion"] as const;

function RichText({ text, locale }: { text: string; locale: Locale }) {
  const pattern = new RegExp(`(${LINKED.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  const parts = text.split(pattern);
  return parts.map((part, index) => {
    if (part === LEGAL_EMAIL) {
      return (
        <a key={index} href={`mailto:${LEGAL_EMAIL}`}>
          {LEGAL_EMAIL}
        </a>
      );
    }
    if (part === "/privacy" || part === "/terms" || part === "/data-deletion") {
      const label =
        locale === "vi"
          ? part === "/privacy"
            ? "chính sách quyền riêng tư"
            : part === "/terms"
              ? "điều khoản"
              : "trang xóa dữ liệu"
          : part === "/privacy"
            ? "privacy policy"
            : part === "/terms"
              ? "terms"
              : "data-deletion page";
      return (
        <Link key={index} href={localePath(locale, part)} prefetch={false}>
          {label}
        </Link>
      );
    }
    return part;
  });
}

export function LegalPage({ locale, document }: { locale: Locale; document: LegalDocument }) {
  return (
    <main id="main" className="page-enter">
      <PageHero eyebrow="PARA" title={document.title} intro={document.intro} />
      <article className="legal-doc section-pad">
        <div className="wrap">
          <p className="legal-updated">{document.updated}</p>
          {document.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>
                  <RichText text={paragraph} locale={locale} />
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
