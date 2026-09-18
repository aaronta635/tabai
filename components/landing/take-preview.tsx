export function TakePreview({
  piece,
  factA,
  factB,
  play,
}: {
  piece: string;
  factA: string;
  factB: string;
  play: string;
}) {
  return (
    <div className="take-preview">
      <div className="take-preview-screen">
        <div className="take-preview-strings" aria-hidden>
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="take-preview-play">{play}</div>
        <p className="take-preview-piece">{piece}</p>
      </div>
      <div className="take-preview-facts">
        <span>{factA}</span>
        <span>{factB}</span>
      </div>
    </div>
  );
}
