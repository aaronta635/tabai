import type { TakeLogView } from "@/lib/take-log";

export function TakeLogNote({ view }: { view: TakeLogView }) {
  return (
    <div className="analyze-status" role="status" data-kind={view.kind}>
      <p className="text-sm">{view.line}</p>
      {view.open ? (
        <div className="analyze-bar" role="progressbar" aria-valuetext={view.line}>
          <span />
        </div>
      ) : null}
      {view.detail ? <pre className="analyze-log">{view.detail}</pre> : null}
    </div>
  );
}
