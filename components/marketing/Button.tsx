import { cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactElement } from "react";
import styles from "./Button.module.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
  size?: "sm" | "md" | "lg";
  shape?: "pill";
  /** Render the single child element (for example an anchor) with the button styles. */
  asChild?: boolean;
}

/** Pill button. Primary is ink with white text, outline is white with a hairline border. */
export function Button({
  variant = "primary",
  size = "md",
  shape = "pill",
  asChild = false,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], styles[shape], className]
    .filter(Boolean)
    .join(" ");

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      className: [classes, child.props.className].filter(Boolean).join(" "),
    });
  }

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
