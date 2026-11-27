import {
  ArrowRight,
  ClipboardList,
  Eye,
  Menu,
  MessageCircle,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";

/** Website icons: an open, thin, rounded line set (Lucide), drawn in the surrounding text colour. */
const icons: Record<string, LucideIcon> = {
  "arrow-right": ArrowRight,
  alert: TriangleAlert,
  assignment: ClipboardList,
  close: X,
  comment: MessageCircle,
  menu: Menu,
  review: Eye,
};

/** Thin strokes keep the icons light next to the device's own font. */
export const SITE_ICON_STROKE = 1.5;

export function ParaIcon({
  name,
  music = false,
}: {
  name: string;
  music?: boolean;
}) {
  const Icon = icons[name] ?? ArrowRight;
  return (
    <Icon
      className={`para-icon ${music ? "music-icon" : ""}`}
      strokeWidth={SITE_ICON_STROKE}
      absoluteStrokeWidth={false}
      aria-hidden="true"
      focusable="false"
    />
  );
}
