import type { HTMLAttributes, ReactNode } from "react";
import { RdIcon } from "@/components/ui/rd-icon";

/**
 * PARA app redesign, phase 0: card. Not used by any live screen yet.
 * Soft grey surface. The selected state follows the sand rules: sand tint background, a 3px
 * sand bar, bold #111 text and a tick with words, so it never relies on sand alone.
 */
type RdCardProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  children?: ReactNode;
  selected?: boolean;
  /** Visible words next to the tick when selected, e.g. "Selected" / "Đã chọn". */
  selectedLabel?: string;
};

export function RdCard({ title, children, selected = false, selectedLabel = "Selected", className, ...rest }: RdCardProps) {
  return (
    <div
      {...rest}
      className={["rd-card", selected ? "rd-card--selected" : "", className].filter(Boolean).join(" ")}
      data-selected={selected || undefined}
    >
      {selected && (
        <p className="rd-card__selected-mark">
          <RdIcon name="check" size={16} stroke={2} />
          <span>{selectedLabel}</span>
        </p>
      )}
      {title && <h3 className="rd-card__title">{title}</h3>}
      {children && <div className="rd-card__body">{children}</div>}
    </div>
  );
}
