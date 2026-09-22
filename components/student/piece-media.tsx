import { LoopSpeedPlayer } from "@/components/student/loop-speed-player";

export function PieceMedia({
  tutorialUrl,
  clipUrl,
  sheetUrl,
  sheetKind,
  labels,
}: {
  tutorialUrl: string | null;
  clipUrl: string | null;
  sheetUrl: string | null;
  sheetKind: "pdf" | "image" | "file";
  labels: { reference: string; clip: string; sheet: string; openSheet: string };
}) {
  return (
    <>
      {tutorialUrl ? (
        <section className="tile">
          <LoopSpeedPlayer src={tutorialUrl} label={labels.reference} />
        </section>
      ) : null}
      {clipUrl ? (
        <section className="tile">
          <LoopSpeedPlayer src={clipUrl} label={labels.clip} />
        </section>
      ) : null}
      {sheetUrl ? (
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
      ) : null}
    </>
  );
}
