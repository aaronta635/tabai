"use client";

import { useEffect, useState } from "react";
import { formatClock, SAI_REASONS, verdictMarked, verdictSends, type FactVerdict, type ObservationMarker } from "@/lib/score-model";

type Copy = {
  help: string;
  trueLabel: string;
  falseLabel: string;
  positives: string;
  reasons: Record<(typeof SAI_REASONS)[number], string>;
};

export function FactBars({
  resetKey,
  markers,
  verdicts,
  positives,
  judgeNote,
  copy,
  onSeek,
  onVerdict,
}: {
  resetKey: string;
  markers: ObservationMarker[];
  verdicts?: Record<number, FactVerdict>;
  positives: string[];
  judgeNote?: string | null;
  copy: Copy;
  onSeek: (tStart: number) => void;
  onVerdict?: (issueIndex: number, verdict: FactVerdict) => Promise<void> | void;
}) {
  const [local, setLocal] = useState<Record<number, FactVerdict>>({});

  useEffect(() => {
    setLocal({});
  }, [resetKey]);

  if (markers.length === 0 && positives.length === 0 && !judgeNote) return null;

  return (
    <div className="fact-strip">
      {judgeNote ? <p className="fact-strip-help">{judgeNote}</p> : null}
      {copy.help && markers.length > 0 ? <p className="fact-strip-help">{copy.help}</p> : null}
      {markers.map((marker) => {
        const verdict = verdicts?.[marker.index] ?? local[marker.index] ?? marker.verdict ?? null;
        const detail =
          marker.expected.trim() && marker.observed.trim()
            ? `${marker.expected} vs ${marker.observed}`
            : marker.expected.trim() || marker.observed.trim() || marker.type;
        return (
          <div key={`${marker.index}-${marker.tStart}`} className="fact-bar" data-verdict={verdict ?? "none"}>
            <button type="button" className="fact-bar-seek" onClick={() => onSeek(marker.tStart)}>
              {formatClock(marker.tStart)}
            </button>
            <p className="fact-bar-copy">{detail}</p>
            {onVerdict ? (
              <div className="fact-bar-verdicts">
                <button
                  type="button"
                  className="chip"
                  aria-pressed={verdictSends(verdict)}
                  onClick={() => {
                    const next: FactVerdict = verdictSends(verdict) ? null : "correct_and_send";
                    setLocal((prev) => ({ ...prev, [marker.index]: next }));
                    void onVerdict(marker.index, next);
                  }}
                >
                  {copy.trueLabel}
                </button>
                <button
                  type="button"
                  className="chip"
                  aria-pressed={verdictMarked(verdict) && !verdictSends(verdict)}
                  onClick={() => {
                    const next: FactVerdict = verdictMarked(verdict) && !verdictSends(verdict) ? null : "wrong_detection";
                    setLocal((prev) => ({ ...prev, [marker.index]: next }));
                    void onVerdict(marker.index, next);
                  }}
                >
                  {copy.falseLabel}
                </button>
                {verdictMarked(verdict) && !verdictSends(verdict) ? (
                  <select
                    className="chip"
                    aria-label={copy.falseLabel}
                    value={SAI_REASONS.includes(verdict as (typeof SAI_REASONS)[number]) ? verdict! : "wrong_detection"}
                    onChange={(event) => {
                      const next = event.target.value as FactVerdict;
                      setLocal((prev) => ({ ...prev, [marker.index]: next }));
                      void onVerdict(marker.index, next);
                    }}
                  >
                    {SAI_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {copy.reasons[reason]}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
      {positives.length > 0 ? (
        <p className="fact-positives">
          {copy.positives}: {positives.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
