import type { CSSProperties } from "react";

/** Render supplied SVG geometry in the surrounding accessible text colour. */
export function ParaIcon({
  name,
  music = false,
}: {
  name: string;
  music?: boolean;
}) {
  // Application icons stay solid/currentColor, even when next to music copy.
  const asset =
    name === "arrow-right" ? "forward" : name === "alert" ? "warning" : name;
  const path = `/brand/para/resources/para-ui-${asset}-24-solid.svg`;
  return (
    <span
      className={`para-icon ${music ? "music-icon" : ""}`}
      style={{ "--icon-url": `url("${path}")` } as CSSProperties}
      aria-hidden="true"
    />
  );
}
