/** A "+" that unfolds a form in place. Folded is the resting state. */
export function AddPanel({
  label,
  children,
  open = false,
}: {
  label: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details className="add" open={open}>
      <summary>
        <i aria-hidden>+</i>
        <span>{label}</span>
      </summary>
      <div className="add-panel">{children}</div>
    </details>
  );
}

/** A section that shows its size first and its contents on click. */
export function SectionPanel({
  title,
  count,
  children,
  open = false,
}: {
  title: string;
  count?: number | string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details className="panel" open={open}>
      <summary>
        <span className="panel-title">{title}</span>
        {count === undefined ? null : <span className="panel-count tabular">{count}</span>}
        <span className="panel-chev" aria-hidden>
          ›
        </span>
      </summary>
      <div className="panel-body">{children}</div>
    </details>
  );
}
