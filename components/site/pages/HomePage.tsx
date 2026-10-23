import { HeroLoopJourney } from "@/components/site/HeroLoopJourney";
import { BeliefMoment } from "@/components/site/BeliefMoment";
import { PerspectiveSwitcher } from "@/components/site/PerspectiveSwitcher";
import { WaitlistSection } from "@/components/site/WaitlistSection";
import { content, type Locale } from "@/lib/site/content";
export function HomePage({ locale }: { locale: Locale }) {
  return (
    <main id="main" className="studio-home">
      <HeroLoopJourney locale={locale} />
      <PerspectiveSwitcher
        locale={locale}
        content={content[locale].home.perspectives}
      />
      <BeliefMoment
        content={content[locale].belief}
        locale={locale}
        immersive
      />
      <WaitlistSection locale={locale} />
    </main>
  );
}
