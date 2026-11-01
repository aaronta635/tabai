/** Approved PARA resource-pack geometry; decorative only. Name the owning control. */
export type ParaIconName =
  "plus"
  | "upload"
  | "trash"
  | "home"
  | "calendar"
  | "class"
  | "assignment"
  | "video"
  | "progress"
  | "settings"
  | "menu"
  | "close"
  | "search"
  | "record"
  | "stop"
  | "check"
  | "chevron-left"
  | "chevron-right"
  | "sun"
  | "moon";

export function ParaIcon({ name, className = "" }: { name: ParaIconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" className={`para-student-icon ${className}`}>
      <use href={`/para-app/icons.svg#para-${name}`} />
    </svg>
  );
}
