import Image from "next/image";

export function BrandMark({
  light = false,
  compact = false,
  priority = false,
}: {
  light?: boolean;
  compact?: boolean;
  priority?: boolean;
}) {
  return (
    <span
      className={`brand-mark ${light ? "brand-mark-light" : ""} ${compact ? "brand-mark-compact" : ""}`}
      aria-label="howl0"
    >
      {compact ? null : (
        <span className="brand-mark-how" aria-hidden>
          how
        </span>
      )}
      <Image
        src="/brand/howl0-symbol.png"
        alt={compact ? "howl0" : ""}
        width={512}
        height={343}
        className="brand-mark-symbol"
        priority={priority}
      />
    </span>
  );
}
