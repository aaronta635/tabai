"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";

type Props = {
  accept: string;
  buttonLabel: string;
  changeLabel: string;
  file: File | null;
  onFile: (file: File | null) => void;
  name?: string;
  hint?: string;
  capture?: "user" | "environment";
  size?: "md" | "lg";
  dropTitle?: string;
  dropHint?: string;
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePicker({
  accept,
  buttonLabel,
  changeLabel,
  file,
  onFile,
  name,
  hint,
  capture,
  size = "md",
  dropTitle,
  dropHint,
}: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const drop = Boolean(dropTitle);

  useEffect(() => {
    if (!file && inputRef.current) inputRef.current.value = "";
  }, [file]);

  function takeDrop(event: DragEvent) {
    event.preventDefault();
    setOver(false);
    const next = event.dataTransfer.files?.[0];
    if (next) onFile(next);
  }

  const dropEvents = drop
    ? {
        onDragOver: (event: DragEvent) => {
          event.preventDefault();
          setOver(true);
        },
        onDragLeave: () => setOver(false),
        onDrop: takeDrop,
      }
    : {};

  return (
    <div>
      <input
        id={id}
        ref={inputRef}
        name={name}
        type="file"
        accept={accept}
        capture={capture}
        aria-label={drop ? buttonLabel : undefined}
        className="sr-only"
        onChange={(event) => {
          onFile(event.target.files?.[0] ?? null);
        }}
      />
      {file && drop ? (
        <div className={`submit-drop${over ? " is-over" : ""}`} {...dropEvents}>
          <p className="submit-drop-title">{file.name}</p>
          <p className="submit-drop-hint">{formatBytes(file.size)}</p>
          <label htmlFor={id} className="btn btn-quiet">
            {changeLabel}
          </label>
        </div>
      ) : file ? (
        <div className="flex items-center gap-3 rounded-2xl border border-ink/15 bg-white px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{file.name}</p>
            <p className="text-xs text-ink-soft">{formatBytes(file.size)}</p>
          </div>
          <label
            htmlFor={id}
            className="shrink-0 cursor-pointer rounded-full border border-ink/15 px-3 py-1.5 text-sm hover:bg-paper"
          >
            {changeLabel}
          </label>
        </div>
      ) : drop ? (
        <label htmlFor={id} className={`submit-drop${over ? " is-over" : ""}`} {...dropEvents}>
          <span className="submit-drop-mark" aria-hidden>
            ↑
          </span>
          <span className="submit-drop-title">{dropTitle}</span>
          {dropHint ? <span className="submit-drop-hint">{dropHint}</span> : null}
          <span className="btn btn-quiet">{buttonLabel}</span>
        </label>
      ) : (
        <label
          htmlFor={id}
          className={`block w-full cursor-pointer rounded-2xl border border-dashed border-ink/25 bg-white text-center text-sm font-medium hover:border-ink/40 hover:bg-cream ${
            size === "lg" ? "px-4 py-8" : "px-4 py-5"
          }`}
        >
          {buttonLabel}
        </label>
      )}
      {hint ? <p className="mt-1 text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}

