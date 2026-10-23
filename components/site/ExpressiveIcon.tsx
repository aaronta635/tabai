/** Supplied grain symbols are storytelling artwork, never tiny UI controls. */
export function ExpressiveIcon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <img
      className={`expressive-icon ${className}`}
      src={`/brand/para/resources/para-expressive-${name}-grain.svg`}
      alt=""
      aria-hidden="true"
      width={192}
      height={192}
      loading="lazy"
    />
  );
}
