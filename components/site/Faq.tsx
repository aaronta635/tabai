export function Faq({
  items,
}: {
  items: readonly (readonly [string, string])[];
}) {
  return (
    <div className="faq-list">
      {items.map(([q, a], i) => (
        <details key={q}>
          <summary>
            <span className="faq-number">{String(i + 1).padStart(2, "0")}</span>
            <span>{q}</span>
            <span className="faq-plus" aria-hidden="true">
              +
            </span>
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
