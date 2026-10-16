import { displayCueInstruction, displayCueTopic } from "@/lib/chord-tones";
import {
  chordsFromScore,
  formatClock,
  parseTrainExtract,
  type TrainExtract,
} from "@/lib/score-model";

export function extractFromUnknown(value: unknown): TrainExtract | null {
  if (!value || typeof value !== "object") return null;
  return parseTrainExtract(value);
}

export function ScoreExtractView({
  extract,
  empty,
  chordsLabel,
  cuesLabel,
  rawLabel,
}: {
  extract: TrainExtract | null;
  empty: string;
  chordsLabel: string;
  cuesLabel: string;
  rawLabel: string;
}) {
  if (!extract) {
    return <p className="text-sm text-ink-soft">{empty}</p>;
  }
  const chords = chordsFromScore(extract);
  const cues = extract.tutorialCues;
  return (
    <div>
      {extract.key !== "unknown" || extract.tempoBpm ? (
        <p className="text-sm text-ink-soft">
          {[extract.key, extract.timeSignature, extract.tempoBpm ? `${extract.tempoBpm} bpm` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}
      <p className="field-label mt-3">{chordsLabel}</p>
      {chords.length > 0 ? (
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {chords.map((chord) => (
            <li key={chord} className="chip">
              {chord}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-sm text-ink-soft">{empty}</p>
      )}
      <p className="field-label mt-4">{cuesLabel}</p>
      {cues.length === 0 ? (
        <p className="mt-1.5 text-sm text-ink-soft">{empty}</p>
      ) : (
        <ol className="mt-1.5 space-y-2">
          {cues.map((cue, index) => {
            const topic = displayCueTopic(cue.topic, cue.instruction);
            return (
              <li key={`${cue.tStart}-${index}`} className="piece-row">
                <p className="font-ui tabular text-xs text-ink-soft">
                  {formatClock(cue.tStart)}
                  {cue.tEnd != null ? `–${formatClock(cue.tEnd)}` : ""}
                  {topic ? ` · ${topic}` : ""}
                </p>
                <p className="mt-1 leading-relaxed">{displayCueInstruction(cue.instruction)}</p>
              </li>
            );
          })}
        </ol>
      )}
      <details className="mt-4">
        <summary className="font-ui text-sm text-ink-soft">{rawLabel}</summary>
        <pre className="mt-2 overflow-x-auto rounded-xl bg-paper p-3 text-xs leading-relaxed">
          {JSON.stringify(extract, null, 2)}
        </pre>
      </details>
    </div>
  );
}
