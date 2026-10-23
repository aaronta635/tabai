import { StudioEntry } from "@/components/site/studio-entry";
import { WaitlistForm } from "@/components/site/WaitlistForm";
import { content, type Locale } from "@/lib/site/content";
import Link from "next/link";
import { localePath } from "@/lib/site/content";
import { sceneCopy } from "@/lib/site/studio";
import { BrandLogo } from "@/components/site/BrandLogo";
import { ScrollScene } from "@/components/site/ScrollScene";
import { SceneHeading } from "@/components/site/SceneHeading";
import { ParaIcon } from "@/components/site/ParaIcon";
import { PerformancePortraits } from "@/components/site/PerformancePortraits";
export function WaitlistSection({ locale }: { locale: Locale }) {
  const page = content[locale].waitlist;
  const copy = sceneCopy(locale);
  return (
    <ScrollScene id="waitlist" className="waitlist scene-closing">
      <div className="wrap closing-editorial">
        <PerformancePortraits locale={locale} />
        <div className="closing-mark">
          <BrandLogo width={280} height={76} footer />
        </div>
      </div>
      <div className="wrap waitlist-grid">
        <div>
          <p className="eyebrow">{page.eyebrow}</p>
          <SceneHeading lines={copy.closeLines} />
          <p>{copy.closeCopy}</p>
          <Link
            className="text-link"
            href={localePath(locale, "/product")}
            prefetch={false}
          >
            {copy.closeAction}
            <ParaIcon name="arrow-right" />
          </Link>
        </div>
        <div>
          <StudioEntry locale={locale} />
          <WaitlistForm locale={locale} />
        </div>
      </div>
    </ScrollScene>
  );
}
