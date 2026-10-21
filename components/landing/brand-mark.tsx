export function BrandMark({
  light = false,
  compact = false,
  priority = false,
}: {
  light?: boolean;
  compact?: boolean;
  priority?: boolean;
}) {
  const src = compact
    ? light
      ? "/brand/para-symbol-ivory.svg"
      : "/brand/para-symbol-espresso.svg"
    : light
      ? "/brand/para-horizontal-ivory.svg"
      : "/brand/para-horizontal-espresso.svg";

  return (
    <span
      className={`brand-mark ${light ? "brand-mark-light" : ""} ${compact ? "brand-mark-compact" : ""}`}
      aria-label="PARA"
    >
      <img
        src={src}
        alt=""
        width={compact ? 290 : 1106}
        height={300}
        className="brand-mark-symbol"
        fetchPriority={priority ? "high" : "auto"}
      />
    </span>
  );
}
