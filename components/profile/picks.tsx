"use client";

import { useState } from "react";

type Option = { value: string; label: string };

export function PickOne({
  name,
  legend,
  options,
  initial,
}: {
  name: string;
  legend: string;
  options: Option[];
  initial?: string;
}) {
  const [value, setValue] = useState(initial ?? "");
  return (
    <fieldset>
      <legend className="field-label mb-2">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const on = value === option.value;
          return (
            <label key={option.value} className={`pick ${on ? "pick-on" : ""}`}>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={on}
                onChange={() => setValue(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PickMany({
  name,
  legend,
  options,
  initial = [],
}: {
  name: string;
  legend: string;
  options: Option[];
  initial?: string[];
}) {
  const [values, setValues] = useState<string[]>(initial);
  return (
    <fieldset>
      <legend className="field-label mb-2">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const on = values.includes(option.value);
          return (
            <label key={option.value} className={`pick ${on ? "pick-on" : ""}`}>
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={on}
                onChange={() =>
                  setValues((current) =>
                    current.includes(option.value)
                      ? current.filter((item) => item !== option.value)
                      : [...current, option.value],
                  )
                }
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
