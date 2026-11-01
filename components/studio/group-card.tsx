import Link from "next/link";

export function GroupCard({
  href,
  title,
  meta,
  chip,
  meterLabel,
  meterValue,
  meterWidth,
  actions,
  showMeter = true,
}: {
  href: string;
  title: string;
  meta?: string;
  chip: string;
  meterLabel: string;
  meterValue: string;
  meterWidth: number;
  actions: { href: string; label: string }[];
  showMeter?: boolean;
}) {
  return (
    <article className="group-card">
      <div className="group-card-top">
        <div className="min-w-0">
          <Link href={href} className="group-card-title">
            {title}
          </Link>
          {meta ? <p className="group-card-meta">{meta}</p> : null}
        </div>
        <span className="open-chip">{chip}</span>
      </div>
      <div className="meter-block">
        <p className="meter-label">
          <span>{meterLabel}</span>
          <span className="tabular">{meterValue}</span>
        </p>
        {showMeter ? <span className="meter" aria-hidden>
          <span style={{ width: `${meterWidth}%` }} />
        </span> : null}
      </div>
      {actions.length > 0 ? (
        <div className="group-actions">
          {actions.map((action) => (
            <Link key={action.href + action.label} href={action.href}>
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function meterWidth(count: number, max: number) {
  if (count <= 0 || max <= 0) return 0;
  return Math.max(12, Math.round((count / max) * 100));
}
