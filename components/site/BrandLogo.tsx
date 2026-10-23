/** Exact optical web exports from PARA_Brand_Resources. No path modification. */
export function BrandLogo({
  width,
  className,
  footer = false,
}: {
  width: number;
  height: number;
  className?: string;
  footer?: boolean;
}) {
  return (
    <picture className={`brand-logo ${footer ? "brand-logo-expressive" : ""}`}>
      {footer && (
        <>
          <source
            media="(max-width: 360px) and (prefers-color-scheme: dark)"
            srcSet="/brand/para/resources/para-horizontal-ivory-optical.svg"
          />
          <source
            media="(max-width: 360px)"
            srcSet="/brand/para/resources/para-horizontal-espresso-optical.svg"
          />
        </>
      )}
      <source
        media="(prefers-color-scheme: dark)"
        srcSet={`/brand/para/resources/para-horizontal-${footer ? "dark-grain" : "ivory"}-optical.svg`}
      />
      <img
        className={className}
        src={`/brand/para/resources/para-horizontal-${footer ? "light-grain" : "espresso"}-optical.svg`}
        alt="PARA"
        width={width}
        height={Math.round((width * 300) / 1106)}
      />
    </picture>
  );
}
