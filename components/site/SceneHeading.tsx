import type { CSSProperties } from "react";

/** Phrase wrappers preserve a single semantic heading and natural VI wrapping. */
export function SceneHeading({
  lines,
  level = 2,
  id,
  className = "",
}: {
  lines: readonly string[];
  level?: 1 | 2;
  id?: string;
  className?: string;
}) {
  const Tag = level === 1 ? "h1" : "h2";
  return (
    <Tag id={id} className={`scene-heading ${className}`}>
      {lines.map((line, index) => (
        <span className="headline-mask" key={line}>
          <span style={{ "--line-index": index } as CSSProperties}>{line}</span>
          {index < lines.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
