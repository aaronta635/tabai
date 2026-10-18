"use client";

import { useEffect, useState } from "react";
import { formatClock, type FactVerdict, type ObservationMarker } from "@/lib/score-model";

type Copy = {
  help: string;
  trueLabel: string;
  falseLabel: string;
  positives: string;
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
                  aria-pressed={verdict === "true"}
                  onClick={() => {
                    const next: FactVerdict = verdict === "true" ? null : "true";
                    setLocal((prev) => ({ ...prev, [marker.index]: next }));
                    void onVerdict(marker.index, next);
                  }}
                >
                  {copy.trueLabel}
                </button>
                <button
                  type="button"
                  className="chip"
                  aria-pressed={verdict === "false"}
                  onClick={() => {
                    const next: FactVerdict = verdict === "false" ? null : "false";
                    setLocal((prev) => ({ ...prev, [marker.index]: next }));
                    void onVerdict(marker.index, next);
                  }}
                >
                  {copy.falseLabel}
                </button>
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
