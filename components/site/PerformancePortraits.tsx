import Image from "next/image";
import type { Locale } from "@/lib/site/content";
import { PointerSurface } from "@/components/site/PointerSurface";

const descriptions = {
  en: {
    duo: "Two PARA founders performing together on stage.",
    bass: "A PARA founder playing bass among other musicians.",
  },
  vi: {
    duo: "Hai nhà sáng lập PARA cùng biểu diễn trên sân khấu.",
    bass: "Một nhà sáng lập PARA chơi guitar bass cùng các nhạc công khác.",
  },
};

/** Original portrait framing keeps both playing hands and instruments intact. */
export function PerformancePortraits({ locale }: { locale: Locale }) {
  return (
    <div className="performance-portraits">
      <PointerSurface
        as="figure"
        depth
        className="performance-print performance-print-duo"
      >
        <div className="performance-photo-depth">
          <Image
            src="/images/performance/stage-duo.webp"
            width={900}
            height={1358}
            sizes="(max-width: 560px) calc(57.5vw - 46px), 280px"
            alt={descriptions[locale].duo}
            loading="lazy"
          />
        </div>
      </PointerSurface>
      <PointerSurface
        as="figure"
        depth
        className="performance-print performance-print-bass"
      >
        <div className="performance-photo-depth">
          <Image
            src="/images/performance/bass-performance.webp"
            width={800}
            height={1421}
            sizes="(max-width: 560px) calc(42.5vw - 38px), 200px"
            alt={descriptions[locale].bass}
            loading="lazy"
          />
        </div>
      </PointerSurface>
    </div>
  );
}
