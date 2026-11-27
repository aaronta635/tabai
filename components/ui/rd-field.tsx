import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { RdIcon } from "@/components/ui/rd-icon";

/**
 * PARA app redesign, phase 0: text field. Not used by any live screen yet.
 * Label above, optional hint, and an error shown as an icon plus words (never colour alone),
 * all tied to the input with aria-describedby. Labels wrap, so longer Vietnamese text fits.
 */
type RdFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "children"> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Text after the label for optional fields, e.g. "(optional)" / "(không bắt buộc)". */
  optionalLabel?: string;
  id?: string;
};

export function RdField({
  label,
  hint,
  error,
  optionalLabel,
  id,
  type = "text",
  className,
  "aria-describedby": describedByProp,
  ...input
}: RdFieldProps) {
  const autoId = useId();
  const inputId = id ?? `rd-field-${autoId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [describedByProp, hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={["rd-field", className].filter(Boolean).join(" ")}>
      <label className="rd-field__label" htmlFor={inputId}>
        {label}
        {optionalLabel && <span className="rd-field__optional"> {optionalLabel}</span>}
      </label>
      {hint && (
        <p className="rd-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      <input
        {...input}
        id={inputId}
        type={type}
        className="rd-field__input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {error && (
        <p className="rd-field__error" id={errorId}>
          <RdIcon name="alert" size={18} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
