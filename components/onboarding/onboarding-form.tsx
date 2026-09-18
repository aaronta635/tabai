"use client";

import { useState } from "react";
import { saveStudentOnboarding, saveTutorOnboarding } from "@/app/onboarding/actions";

type Choice = { value: string; label: string };

function Choices({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Choice[];
}) {
  return (
    <div className="grid gap-2">
      {options.map((option) => {
        const on = value === option.value;
        return (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center rounded-2xl border px-4 py-3 text-sm ${
              on ? "border-beat bg-paper" : "border-ink/10 bg-white hover:border-ink/25"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={on}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}

export function TutorOnboardingForm({
  defaultName,
  labels,
}: {
  defaultName: string;
  labels: {
    name: string;
    q1: string;
    q2: string;
    q3: string;
    videosZalo: string;
    videosInPerson: string;
    videosNone: string;
    sizeFew: string;
    sizeClass: string;
    sizeMany: string;
    focusBeat: string;
    focusNotes: string;
    focusBoth: string;
    continue: string;
    incomplete: string;
  };
}) {
  const [videos, setVideos] = useState("");
  const [size, setSize] = useState("");
  const [focus, setFocus] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (form) => {
        const result = await saveTutorOnboarding(form);
        if (result?.error) setError(labels.incomplete);
      }}
      className="space-y-6"
    >
      <label className="block text-sm">
        {labels.name}
        <input
          required
          name="name"
          defaultValue={defaultName}
          className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3"
        />
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{labels.q1}</legend>
        <Choices
          name="videos"
          value={videos}
          onChange={setVideos}
          options={[
            { value: "zalo", label: labels.videosZalo },
            { value: "in_person", label: labels.videosInPerson },
            { value: "none", label: labels.videosNone },
          ]}
        />
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{labels.q2}</legend>
        <Choices
          name="size"
          value={size}
          onChange={setSize}
          options={[
            { value: "few", label: labels.sizeFew },
            { value: "class", label: labels.sizeClass },
            { value: "many", label: labels.sizeMany },
          ]}
        />
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{labels.q3}</legend>
        <Choices
          name="focus"
          value={focus}
          onChange={setFocus}
          options={[
            { value: "beat", label: labels.focusBeat },
            { value: "notes", label: labels.focusNotes },
            { value: "both", label: labels.focusBoth },
          ]}
        />
      </fieldset>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button type="submit" className="w-full rounded-2xl bg-beat px-4 py-3 text-white">
        {labels.continue}
      </button>
    </form>
  );
}

export function StudentOnboardingForm({
  defaultName,
  labels,
}: {
  defaultName: string;
  labels: {
    name: string;
    age: string;
    adult: string;
    under18: string;
    q1: string;
    q2: string;
    q3: string;
    codePlaceholder: string;
    playingWeeks: string;
    playingMonths: string;
    playingYears: string;
    workChords: string;
    workSong: string;
    workExam: string;
    contact: string;
    zalo: string;
    messenger: string;
    continue: string;
    incomplete: string;
    badCode: string;
  };
}) {
  const [playing, setPlaying] = useState("");
  const [work, setWork] = useState("");
  const [ageBand, setAgeBand] = useState("adult");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (form) => {
        const result = await saveStudentOnboarding(form);
        if (result?.error === "code") setError(labels.badCode);
        else if (result?.error) setError(labels.incomplete);
      }}
      className="space-y-6"
    >
      <label className="block text-sm">
        {labels.name}
        <input
          required
          name="name"
          defaultValue={defaultName}
          className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3"
        />
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{labels.age}</legend>
        <Choices
          name="ageBand"
          value={ageBand}
          onChange={setAgeBand}
          options={[
            { value: "adult", label: labels.adult },
            { value: "under18", label: labels.under18 },
          ]}
        />
      </fieldset>
      <label className="block text-sm">
        {labels.q1}
        <input
          name="code"
          placeholder={labels.codePlaceholder}
          className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3"
        />
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{labels.q2}</legend>
        <Choices
          name="playing"
          value={playing}
          onChange={setPlaying}
          options={[
            { value: "weeks", label: labels.playingWeeks },
            { value: "months", label: labels.playingMonths },
            { value: "years", label: labels.playingYears },
          ]}
        />
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{labels.q3}</legend>
        <Choices
          name="work"
          value={work}
          onChange={setWork}
          options={[
            { value: "chords", label: labels.workChords },
            { value: "song", label: labels.workSong },
            { value: "exam", label: labels.workExam },
          ]}
        />
      </fieldset>
      <label className="block text-sm">
        {labels.contact}
        <input
          name="contactHandle"
          placeholder={labels.zalo}
          className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3"
        />
      </label>
      <input type="hidden" name="contactType" value="zalo" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button type="submit" className="w-full rounded-2xl bg-beat px-4 py-3 text-white">
        {labels.continue}
      </button>
    </form>
  );
}
