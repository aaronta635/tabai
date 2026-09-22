"use client";

import { useState } from "react";
import { guestJoinClass } from "@/app/onboarding/actions";

export function GuestJoinForm({
  code,
  labels,
}: {
  code: string;
  labels: {
    name: string;
    age: string;
    adult: string;
    under18: string;
    contact: string;
    zalo: string;
    consent: string;
    under18Line: string;
    join: string;
    badCode: string;
    otherClass: string;
    signIn: string;
  };
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (form) => {
        const result = await guestJoinClass(form);
        if (result?.error === "otherClass") setError(labels.otherClass);
        else if (result?.error) setError(labels.badCode);
      }}
      className="mt-6 space-y-3"
    >
      <input type="hidden" name="code" value={code} />
      <input
        name="name"
        required
        placeholder={labels.name}
        className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3"
      />
      <fieldset className="flex gap-3 text-sm">
        <legend className="mb-2 w-full">{labels.age}</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="ageBand" value="adult" defaultChecked />
          {labels.adult}
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="ageBand" value="under18" />
          {labels.under18}
        </label>
      </fieldset>
      <input
        name="contactHandle"
        required
        placeholder={labels.zalo}
        className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3"
      />
      <input type="hidden" name="contactType" value="zalo" />
      <label className="flex items-start gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="consent" value="yes" required className="mt-1" />
        {labels.consent}
      </label>
      <label className="flex items-start gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="under18Ok" value="yes" required className="mt-1" />
        {labels.under18Line}
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button type="submit" className="w-full rounded-xl bg-beat px-4 py-3 text-white">
        {labels.join}
      </button>
    </form>
  );
}
