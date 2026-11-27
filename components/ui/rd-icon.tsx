import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  LoaderCircle,
  Lock,
  LogIn,
  Mail,
  Phone,
  Plus,
  School,
  Search,
  Upload,
  User,
  Users,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";

/**
 * PARA app redesign, phase 0: line icons (lucide-react) for app screens.
 * Not used by any live screen yet; replaces components/ui/para-icon from 7 Dec.
 *
 * Only names in this map can be used. An unknown name is a type error, and at run time it
 * throws outside production instead of quietly drawing a different icon.
 */
export const RD_ICONS = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  check: Check,
  "chevron-down": ChevronDown,
  "chevron-right": ChevronRight,
  alert: CircleAlert,
  success: CircleCheck,
  eye: Eye,
  "eye-off": EyeOff,
  info: Info,
  key: KeyRound,
  loading: LoaderCircle,
  lock: Lock,
  "log-in": LogIn,
  mail: Mail,
  phone: Phone,
  plus: Plus,
  school: School,
  search: Search,
  upload: Upload,
  user: User,
  users: Users,
  video: Video,
  close: X,
} as const satisfies Record<string, LucideIcon>;

export type RdIconName = keyof typeof RD_ICONS;

/** Allowed stroke widths: thin and open, between 1.5 and 2 px. */
export type RdIconStroke = 1.5 | 1.75 | 2;
export const RD_ICON_STROKE: RdIconStroke = 1.75;

export function isRdIconName(name: string): name is RdIconName {
  return Object.prototype.hasOwnProperty.call(RD_ICONS, name);
}

type RdIconProps = {
  name: RdIconName;
  /** Pixel size of the square icon. Defaults to 20. */
  size?: number;
  stroke?: RdIconStroke;
  /** Give a label only when the icon carries meaning on its own; otherwise it is hidden from screen readers. */
  label?: string;
  className?: string;
};

export function RdIcon({ name, size = 20, stroke = RD_ICON_STROKE, label, className }: RdIconProps) {
  const Icon: LucideIcon | undefined = isRdIconName(name) ? RD_ICONS[name] : undefined;
  if (!Icon) {
    const message = `RdIcon: unknown icon name "${String(name)}". Add it to RD_ICONS in components/ui/rd-icon.tsx.`;
    if (process.env.NODE_ENV !== "production") throw new Error(message);
    console.error(message);
    return null;
  }
  const a11y = label
    ? ({ role: "img", "aria-label": label } as const)
    : ({ "aria-hidden": true, focusable: "false" } as const);
  return (
    <Icon
      className={["rd-icon", className].filter(Boolean).join(" ")}
      width={size}
      height={size}
      strokeWidth={stroke}
      absoluteStrokeWidth={false}
      {...a11y}
    />
  );
}
