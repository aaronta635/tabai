import type { InputHTMLAttributes } from "react";
import styles from "./Input.module.css";

/** Pill input with a hairline border and a white fill. */
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={[styles.input, className].filter(Boolean).join(" ")} {...rest} />;
}
