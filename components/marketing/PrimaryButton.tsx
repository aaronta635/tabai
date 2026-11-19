import type { ReactNode } from "react";
import { Button } from "./Button";
import styles from "./PrimaryButton.module.css";

interface PrimaryButtonProps {
  href: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** The main call to action: ink pill, white text, no glow and no shadow. */
export function PrimaryButton({ href, children, size = "md", className }: PrimaryButtonProps) {
  return (
    <span className={`${styles.wrap} ${className ?? ""}`}>
      <Button asChild size={size} shape="pill">
        <a href={href}>{children}</a>
      </Button>
    </span>
  );
}
