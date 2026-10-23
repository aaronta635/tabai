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
          src="/brand/howl0/02-symbols/howl0-return-loop-master.svg"
          alt=""
        />
        <span className="scatter-link">howl0.link/practice</span>
      </div>
    </div>
  );
}
