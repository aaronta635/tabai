import Link from "next/link";
import { localePath, type Locale } from "@/lib/site/content";
import { LEGAL_EMAIL } from "@/lib/site/legal";
import { ScrollScene } from "@/components/site/ScrollScene";
import { ProductCta } from "@/components/site/ProductCta";
import { PerformanceReel } from "@/components/site/PerformanceReel";
import { StudioEntry } from "@/components/site/studio-entry";

const ending = {
  en: {
    availableLines: ["PARA is", "available now"],
    nextLines: ["Your next", "step starts", "here"],
    utilities: [
      [{ label: "Contact", href: `mailto:${LEGAL_EMAIL}` }],
      [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
    ],
  },
  vi: {
    availableLines: ["PARA đã", "sẵn sàng"],
    nextLines: ["Bắt đầu", "bước tiếp theo", "cùng PARA"],
    utilities: [
      [{ label: "Liên hệ", href: `mailto:${LEGAL_EMAIL}` }],
      [
        { label: "Quyền riêng tư", href: "/privacy" },
        { label: "Điều khoản", href: "/terms" },
      ],
    ],
  },
};

export function ProductInvitation({ locale }: { locale: Locale }) {
  const copy = ending[locale];
  return (
    <ScrollScene id="waitlist" className="final-scene">
      <div className="final-composition">
        <h2 className="final-available">
          {copy.availableLines.map((line, index) => (
            <span key={line}>
              {index > 0 && " "}
              {line}
            </span>
          ))}
        </h2>
        <PerformanceReel locale={locale} />
        <div className="final-next-step">
          <p className="final-next">
            {copy.nextLines.map((line, index) => (
              <span key={line}>
                {index > 0 && " "}
                {line}
              </span>
            ))}
          </p>
          <ProductCta
            locale={locale}
            size="large"
            className="final-action"
            compartment
          />
        </div>
      </div>
      <StudioEntry locale={locale} />
      <footer className="final-utilities">
        {copy.utilities.map((group, index) => (
          <div key={index}>
            {group.map((item) =>
              item.href.startsWith("mailto:") ? (
                <a key={item.label} href={item.href}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} href={localePath(locale, item.href)} prefetch={false}>
                  {item.label}
                </Link>
              ),
            )}
          </div>
        ))}
      </footer>
    </ScrollScene>
  );
}
