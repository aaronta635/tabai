import { HeroLoopJourney } from "@/components/site/HeroLoopJourney";
import { BeliefMoment } from "@/components/site/BeliefMoment";
import { PerspectiveSwitcher } from "@/components/site/PerspectiveSwitcher";
import { ProductInvitation } from "@/components/site/ProductInvitation";
import { content, type Locale } from "@/lib/site/content";
import { SharedWaveEnvironment } from "@/components/site/SharedWaveEnvironment";
export function HomePage({ locale }: { locale: Locale }) {
  return (
    <SharedWaveEnvironment>
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
      <ProductInvitation locale={locale} />
    </SharedWaveEnvironment>
  );
}
