import type { ReactNode } from "react";
import { PointerSurface } from "@/components/site/PointerSurface";

/** Keep the backdrop surface separate from foreground content. Animate the
 * surrounding scene wrapper, never opacity/filter on this material root. */
export function GlassLayers() {
  return (
    <>
      <span className="para-glass__surface" aria-hidden="true" />
      <span className="para-glass__texture" aria-hidden="true" />
      <span className="para-glass__rim" aria-hidden="true" />
    </>
  );
}

export function GlassSurface({
  children,
  material = "ivory",
  className = "",
  raised = false,
  rising = false,
  interactive = false,
}: {
  children?: ReactNode;
  material?: "ivory" | "smoke" | "quiet";
  className?: string;
  raised?: boolean;
  rising?: boolean;
  interactive?: boolean;
}) {
  const Surface = interactive ? PointerSurface : "div";
  return (
    <Surface
      className={`para-glass para-glass--${material} ${raised ? "para-glass--raised" : ""} ${rising ? "para-glass--rising" : ""} ${className}`}
    >
      <GlassLayers />
      <div className="para-glass__content">{children}</div>
    </Surface>
  );
}
