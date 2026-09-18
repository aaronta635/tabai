"use client";

import { useState } from "react";
import { joinStudentClass } from "@/app/onboarding/actions";

export function JoinClassForm({
  placeholder,
  submit,
  badCode,
  otherClass,
}: {
  placeholder: string;
  submit: string;
  badCode: string;
  otherClass: string;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (form) => {
        const result = await joinStudentClass(form);
        if (result?.error === "otherClass") setError(otherClass);
        else if (result?.error) setError(badCode);
      }}
      className="mt-4 space-y-2"
    >
      <div className="flex gap-2">
        <input
          name="code"
          required
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-full border border-ink/10 bg-white px-4 py-3"
        />
        <button type="submit" className="rounded-full bg-beat px-4 py-3 text-sm text-white">
          {submit}
        </button>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </form>
  );
}
