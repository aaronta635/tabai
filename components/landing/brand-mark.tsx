export function BrandMark({
  light = false,
  compact = false,
  priority = false,
}: {
  light?: boolean;
  compact?: boolean;
  priority?: boolean;
}) {
  const espresso = compact ? "/brand/para-symbol-espresso.svg" : "/brand/para-horizontal-espresso.svg";
  const ivory = compact ? "/brand/para-symbol-ivory.svg" : "/brand/para-horizontal-ivory.svg";
  const width = compact ? 290 : 1106;

  return (
    <span
      className={`brand-mark ${light ? "brand-mark-light" : ""} ${compact ? "brand-mark-compact" : ""}`}
      aria-label="PARA"
    >
      <img
        src={espresso}
        alt=""
        width={width}
        height={300}
        className="brand-mark-symbol brand-mark-on-light"
        fetchPriority={priority ? "high" : "auto"}
      />
      <img
        src={ivory}
        alt=""
        width={width}
        height={300}
        className="brand-mark-symbol brand-mark-on-dark"
      />
    </span>
  );
}
