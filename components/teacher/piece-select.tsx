"use client";

import { useId, useState } from "react";

export function PieceSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: { id: string; label: string; detail?: string }[];
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const selected = options.find((option) => option.id === value);

  return (
    <div className="piece-select">
      <p className="piece-question" id={`${listId}-label`}>
        {label}
      </p>
      <button
        type="button"
        className="piece-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
      >
        {selected ? selected.label : placeholder}
      </button>
      {open ? (
        <ul id={listId} className="piece-select-menu" role="listbox" aria-labelledby={`${listId}-label`}>
          {options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                role="option"
                aria-selected={option.id === value}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                {option.detail ? <span className="piece-select-detail">{option.detail}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
