import { content, type Locale } from "@/lib/site/content";

export function ScatterSignal({ locale }: { locale: Locale }) {
  const fragments = content[locale].why.fragments;
  return (
    <div
      className="scatter"
      role="img"
      aria-label={content[locale].why.scatterAria}
    >
      {fragments.map((label, index) => (
        <span key={label} className={`scatter-item item-${index + 1}`}>
          {label}
        </span>
      ))}
      <div className="scatter-centre">
        <img
          src="/brand/para/abstract/practice-loop.svg"
          alt=""
        />
        <span className="scatter-link">paramuzic.com/practice</span>
      </div>
    </div>
  );
}
