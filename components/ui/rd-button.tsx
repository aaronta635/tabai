"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { RdIcon, type RdIconName } from "@/components/ui/rd-icon";

/**
 * PARA app redesign, phase 0: button. Not used by any live screen yet.
 * Hover and press change colour only; the button never moves. At least 44px tall, no fixed
 * width, and long (Vietnamese) labels wrap instead of being cut or shrunk.
 */
export type RdButtonVariant = "primary" | "secondary" | "ghost";

type RdButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  variant?: RdButtonVariant;
  /** Stretch to the width of its container (phone forms). */
  block?: boolean;
  /** Shows a loading icon in place of the label without changing the button's size. */
  loading?: boolean;
  /** Read out while loading, e.g. "Signing in" / "Đang đăng nhập". */
  loadingLabel?: string;
  icon?: RdIconName;
  iconPosition?: "start" | "end";
};

export function rdButtonClass(variant: RdButtonVariant = "primary", block = false, extra?: string) {
  return ["rd-button", `rd-button--${variant}`, block ? "rd-button--block" : "", extra ?? ""]
    .filter(Boolean)
    .join(" ");
}

export function RdButton({
  children,
  variant = "primary",
  block = false,
  loading = false,
  loadingLabel = "Loading",
  icon,
  iconPosition = "start",
  disabled,
  type = "button",
  className,
  onClick,
  ...rest
}: RdButtonProps) {
  const iconEl = icon ? <RdIcon name={icon} size={18} /> : null;
  return (
    <button
      {...rest}
      type={type}
      className={rdButtonClass(variant, block, className)}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? (event) => event.preventDefault() : onClick}
    >
      <span className="rd-button__label">
        {iconPosition === "start" && iconEl}
        <span>{children}</span>
        {iconPosition === "end" && iconEl}
      </span>
      {loading && (
        <span className="rd-button__busy">
          <RdIcon name="loading" size={20} />
          <span className="rd-sr-only">{loadingLabel}</span>
        </span>
      )}
    </button>
  );
}
