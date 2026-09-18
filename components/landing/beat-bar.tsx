export function BeatBar({ className = "" }: { className?: string }) {
  return (
    <div className={`beat-bar ${className}`} aria-hidden="true">
      <span className="beat-bar-line" />
      <span className="beat-bar-playhead" />
      <div className="beat-bar-beats">
        <i data-downbeat />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
