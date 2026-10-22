"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { saveStudentOnboarding, saveTutorOnboarding } from "@/app/onboarding/actions";
import { PickMany, PickOne } from "@/components/profile/picks";

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
          <label key={option.value} className={`setup-choice ${on ? "is-on" : ""}`}>
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
  returnTo,
  initialLocale,
  labels,
}: {
  defaultName: string;
  returnTo?: string;
  initialLocale: "vi" | "en";
  labels: {
    name: string;
    feedbackLanguage: string;
    feedbackVi: string;
    feedbackEn: string;
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
  const t = useTranslations("onboarding");
  const [feedbackLocale, setFeedbackLocale] = useState(initialLocale === "en" ? "en" : "vi");
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
      className="setup"
    >
      {returnTo ? <input type="hidden" name="next" value={returnTo} /> : null}
      <label className="setup-block">
        <span className="setup-label">{labels.name}</span>
        <input required name="name" defaultValue={defaultName} className="setup-field setup-field-name" />
      </label>
      <fieldset className="setup-block">
        <legend className="setup-label">{labels.feedbackLanguage}</legend>
        <Choices
          name="feedbackLocale"
          value={feedbackLocale}
          onChange={setFeedbackLocale}
          options={[
            { value: "vi", label: labels.feedbackVi },
            { value: "en", label: labels.feedbackEn },
          ]}
        />
      </fieldset>
      <fieldset className="setup-block">
        <legend className="setup-label">{labels.q1}</legend>
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
      <fieldset className="setup-block">
        <legend className="setup-label">{labels.q2}</legend>
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
      <fieldset className="setup-block">
        <legend className="setup-label">{labels.q3}</legend>
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
      <PickOne
        name="teaching"
        legend={t("timeTeaching")}
        initial="some"
        options={[
          { value: "new", label: t("teachingNew") },
          { value: "some", label: t("teachingSome") },
          { value: "long", label: t("teachingLong") },
        ]}
      />
      <SkillPicks />
      {error ? <p className="setup-error">{error}</p> : null}
      <button type="submit" className="setup-go">
        {labels.continue}
      </button>
    </form>
  );
}

export function StudentOnboardingForm({
  defaultName,
  returnTo,
  labels,
}: {
  defaultName: string;
  returnTo?: string;
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
    phone: string;
    phonePlaceholder: string;
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
      className="setup"
    >
      {returnTo ? <input type="hidden" name="next" value={returnTo} /> : null}
      <label className="setup-block">
        <span className="setup-label">{labels.name}</span>
        <input required name="name" defaultValue={defaultName} autoComplete="name" className="setup-field setup-field-name" />
      </label>
      <fieldset className="setup-block">
        <legend className="setup-label">{labels.age}</legend>
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
      <label className="setup-block">
        <span className="setup-label">{labels.q1}</span>
        <input name="code" placeholder={labels.codePlaceholder} autoComplete="off" className="setup-field" />
      </label>
      <fieldset className="setup-block">
        <legend className="setup-label">{labels.q2}</legend>
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
      <fieldset className="setup-block">
        <legend className="setup-label">{labels.q3}</legend>
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
      <SkillPicks />
      <label className="setup-block">
        <span className="setup-label">{labels.phone}</span>
        <input
          name="contactHandle"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={labels.phonePlaceholder}
          className="setup-field"
        />
      </label>
      <input type="hidden" name="contactType" value="zalo" />
      {error ? <p className="setup-error">{error}</p> : null}
      <button type="submit" className="setup-go">
        {labels.continue}
      </button>
    </form>
  );
}

export function SkillPicks({
  skills = [],
  weaknesses = [],
}: {
  skills?: string[];
  weaknesses?: string[];
}) {
  const t = useTranslations("onboarding");
  return (
    <>
      <PickMany
        name="skills"
        legend={t("skills")}
        initial={skills}
        options={[
          { value: "rhythm", label: t("skillRhythm") },
          { value: "chords", label: t("skillChords") },
          { value: "fingerstyle", label: t("skillFingerstyle") },
          { value: "reading", label: t("skillReading") },
          { value: "singing", label: t("skillSinging") },
        ]}
      />
      <PickMany
        name="weaknesses"
        legend={t("weakness")}
        initial={weaknesses}
        options={[
          { value: "timing", label: t("weakTiming") },
          { value: "chords", label: t("weakChords") },
          { value: "notes", label: t("weakNotes") },
          { value: "confidence", label: t("weakConfidence") },
        ]}
      />
    </>
  );
}
