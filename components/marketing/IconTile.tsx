import React from "react";
import type { LucideIcon } from "lucide-react";
import styles from "./IconTile.module.css";

export type TileTone = "copper" | "amber" | "green" | "blue" | "rose";

interface IconTileProps {
  icon: LucideIcon;
  tone?: TileTone;
  size?: "md" | "sm";
}

/** iOS-style gradient squircle with a white glyph. */
export const IconTile = ({ icon: Icon, tone = "copper", size = "md" }: IconTileProps) => (
  <span className={`${styles.tile} ${styles[tone]} ${styles[size]}`} aria-hidden="true">
    <Icon strokeWidth={1.75} />
  </span>
);
