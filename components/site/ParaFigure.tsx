import { conceptCaption } from "@/lib/site/para";
import type { Locale } from "@/lib/site/content";

export type SignalAsset =
  | "hero-signal"
  | "practice-loop"
  | "feedback-wave"
  | "rhythm-grid"
  | "progress-arc"
  | "upload-transfer"
  | "timestamp-markers";

export function ParaFigure({
  asset,
  locale,
  caption,
  eager = false,
  className = "",
}: {
  asset: SignalAsset;
  locale: Locale;
  caption?: string;
  eager?: boolean;
  className?: string;
}) {
  const symbols: Record<SignalAsset, string> = {
    "hero-signal": "listening",
    "practice-loop": "repeat-improve",
    "feedback-wave": "feedback",
    "rhythm-grid": "rhythm",
    "progress-arc": "progress",
    "upload-transfer": "recording",
    "timestamp-markers": "review",
  };
  return (
    <figure className={`para-figure ${className}`}>
      <div className="illustration-ground">
        <img
          src={`/brand/para/resources/para-expressive-${symbols[asset]}-grain.svg`}
          alt=""
          width={640}
          height={360}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
        />
      </div>
      <figcaption>{caption || conceptCaption(locale)}</figcaption>
    </figure>
  );
}
