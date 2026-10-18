import { formatClock } from "@/lib/score-model";
import { type HeardPitchNote } from "@/lib/pitch-overlay";

export function HeardPitchChips({
  notes,
  error,
  label,
  empty,
  errorLabel,
}: {
  notes: HeardPitchNote[];
  error: string | null;
  label: string;
  empty: string;
  errorLabel: string;
}) {
  const shown = notes.slice(0, 36);
  return (
    <div className="mt-4">
      <p className="field-label">{label}</p>
      {error ? (
        <p className="mt-1.5 text-sm text-ink-soft">
          {errorLabel}: {error}
        </p>
      ) : null}
      {shown.length === 0 ? (
        <p className="mt-1.5 text-sm text-ink-soft">{empty}</p>
      ) : (
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {shown.map((note, index) => (
            <li key={`${note.tStart}-${note.midi}-${index}`} className="chip">
              {formatClock(note.tStart)} {note.name || String(note.midi)}
            </li>
          ))}
          {notes.length > shown.length ? <li className="chip">+{notes.length - shown.length}</li> : null}
        </ul>
      )}
    </div>
  );
}
