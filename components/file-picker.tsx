"use client";

import { useEffect, useId, useRef } from "react";

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
}: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file && inputRef.current) inputRef.current.value = "";
  }, [file]);

  return (
    <div>
      <input
        id={id}
        ref={inputRef}
        name={name}
        type="file"
        accept={accept}
        capture={capture}
        className="sr-only"
        onChange={(event) => {
          onFile(event.target.files?.[0] ?? null);
        }}
      />
      {file ? (
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

