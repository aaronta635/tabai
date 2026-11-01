import { LoopSpeedPlayer } from "@/components/student/loop-speed-player";
import { MusicXmlSheet } from "@/components/student/musicxml-sheet";
import { SyncedTutorial } from "@/components/student/synced-tutorial";
import type { SheetSyncJson } from "@/lib/score-model";

export function PieceMedia({
  tutorialUrl,
  clipUrl,
  sheetUrl,
  sheetKind,
  sheetSync = null,
  labels,
  compact = false,
}: {
  tutorialUrl: string | null;
  clipUrl: string | null;
  sheetUrl: string | null;
  sheetKind: "pdf" | "image" | "musicxml" | "file";
  sheetSync?: SheetSyncJson | null;
  labels: { reference: string; clip: string; sheet: string; openSheet: string };
  compact?: boolean;
}) {
  const synced =
    sheetSync?.confidence === "ok" &&
    sheetSync.points.length > 0 &&
    sheetKind === "musicxml" &&
    sheetUrl &&
    tutorialUrl
      ? { tutorialUrl, sheetUrl, points: sheetSync.points }
      : null;

  return (
    <div className={compact ? "piece-media-compact" : "contents"}>
      {synced ? (
        <SyncedTutorial
          tutorialUrl={synced.tutorialUrl}
          sheetUrl={synced.sheetUrl}
          points={synced.points}
          videoLabel={labels.reference}
          sheetLabel={labels.sheet}
          openSheet={labels.openSheet}
          compact={compact}
          tiled={!compact}
        />
      ) : tutorialUrl ? (
        <section className={compact ? undefined : "tile"}>
          <LoopSpeedPlayer src={tutorialUrl} label={labels.reference} compact={compact} />
        </section>
      ) : null}
      {clipUrl ? (
        <section className={compact ? undefined : "tile"}>
          <LoopSpeedPlayer src={clipUrl} label={labels.clip} compact={compact} />
        </section>
      ) : null}
      {!synced && sheetUrl && sheetKind === "musicxml" ? (
        <section className={compact ? undefined : "tile"}>
          {compact ? null : <p className="mb-2 text-sm">{labels.sheet}</p>}
          <MusicXmlSheet sheetUrl={sheetUrl} openSheet={labels.openSheet} />
        </section>
      ) : null}
      {!synced && sheetUrl && sheetKind !== "musicxml" ? (
        compact ? (
          <a href={sheetUrl} target="_blank" rel="noreferrer" className="btn btn-quiet self-center">
            {labels.openSheet}
          </a>
        ) : (
          <section className="tile">
            <p className="mb-2 text-sm">{labels.sheet}</p>
            {sheetKind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sheetUrl} alt="" className="w-full rounded-2xl bg-white" />
            ) : sheetKind === "pdf" ? (
              <object data={sheetUrl} type="application/pdf" className="h-80 w-full rounded-2xl bg-white">
                <a href={sheetUrl} target="_blank" rel="noreferrer" className="text-sm underline">
                  {labels.openSheet}
                </a>
              </object>
            ) : (
              <a href={sheetUrl} target="_blank" rel="noreferrer" className="text-sm underline">
                {labels.openSheet}
              </a>
            )}
          </section>
        )
      ) : null}
    </div>
  );
}
