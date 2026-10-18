export function AssignmentMeta({
  goal,
  dueLabel,
  goalLabel,
  duePrefix,
}: {
  goal: string | null;
  dueLabel: string | null;
  goalLabel: string;
  duePrefix: string;
}) {
  if (!goal && !dueLabel) return null;
  return (
    <div className="mt-3 space-y-1 rounded-2xl bg-cream px-4 py-3 text-sm">
      {goal ? (
        <p>
          <span className="text-ink-soft">{goalLabel}: </span>
          {goal}
        </p>
      ) : null}
      {dueLabel ? (
        <p>
          <span className="text-ink-soft">{duePrefix} </span>
          {dueLabel}
        </p>
      ) : null}
    </div>
  );
}
