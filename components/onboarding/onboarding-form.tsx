"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { saveStudentOnboarding, saveTutorOnboarding } from "@/app/onboarding/actions";
import { AvatarUpload } from "@/components/profile/avatar-upload";
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

function Question({
  hidden,
  prompt,
  children,
}: {
  hidden: boolean;
  prompt: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="setup-block" hidden={hidden}>
      <legend className="setup-question">{prompt}</legend>
      {children}
    </fieldset>
  );
}

function StepNav({
  step,
  total,
  canNext,
  last,
  onBack,
  onNext,
}: {
  step: number;
  total: number;
  canNext: boolean;
  last: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("onboarding");
  return (
    <div className="setup-nav">
      <p className="setup-progress">{t("progress", { n: step + 1, total })}</p>
      <div className="setup-nav-buttons">
        {step > 0 ? (
          <button type="button" className="setup-go setup-back" onClick={onBack}>
            {t("back")}
          </button>
        ) : (
          <span />
        )}
        {last ? (
          <button type="submit" className="setup-go" disabled={!canNext}>
            {t("continue")}
          </button>
        ) : (
          <button type="button" className="setup-go" disabled={!canNext} onClick={onNext}>
            {t("next")}
          </button>
        )}
      </div>
    </div>
  );
}

export function TutorOnboardingForm({
  defaultName,
  returnTo,
  initialLocale,
  locale,
  labels,
}: {
  defaultName: string;
  returnTo?: string;
  initialLocale: "vi" | "en";
  locale: "vi" | "en";
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
  const [step, setStep] = useState(0);
  const [name, setName] = useState(defaultName);
  const [feedbackLocale, setFeedbackLocale] = useState(initialLocale === "en" ? "en" : "vi");
  const [videos, setVideos] = useState("");
  const [size, setSize] = useState("");
  const [focus, setFocus] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = 10;
  const ready = [
    name.trim().length > 0,
    true,
    true,
    videos !== "",
    size !== "",
    focus !== "",
    true,
    true,
    true,
    consent,
  ];

  return (
    <form
      action={async (form) => {
        const result = await saveTutorOnboarding(form);
        if (result?.error) setError(labels.incomplete);
      }}
      className="setup"
    >
      {returnTo ? <input type="hidden" name="next" value={returnTo} /> : null}
      <Question hidden={step !== 0} prompt={labels.name}>
        <input
          required
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="setup-field setup-field-name"
        />
      </Question>
      <div hidden={step !== 1}>
        <p className="setup-question">{t("photo")}</p>
        <AvatarUpload
          role="teacher"
          name={name || defaultName}
          label={t("photo")}
          help={t("photoHelp")}
          tooBig={t("photoTooBig")}
          failed={t("photoFailed")}
        />
      </div>
      <Question hidden={step !== 2} prompt={labels.feedbackLanguage}>
        <Choices
          name="feedbackLocale"
          value={feedbackLocale}
          onChange={setFeedbackLocale}
          options={[
            { value: "vi", label: labels.feedbackVi },
            { value: "en", label: labels.feedbackEn },
          ]}
        />
      </Question>
      <Question hidden={step !== 3} prompt={labels.q1}>
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
      </Question>
      <Question hidden={step !== 4} prompt={labels.q2}>
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
      </Question>
      <Question hidden={step !== 5} prompt={labels.q3}>
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
      </Question>
      <div hidden={step !== 6}>
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
      </div>
      <div hidden={step !== 7}>
        <PickMany
          name="skills"
          legend={t("skills")}
          options={[
            { value: "rhythm", label: t("skillRhythm") },
            { value: "chords", label: t("skillChords") },
            { value: "fingerstyle", label: t("skillFingerstyle") },
            { value: "reading", label: t("skillReading") },
            { value: "singing", label: t("skillSinging") },
          ]}
        />
      </div>
      <div hidden={step !== 8}>
        <PickMany
          name="weaknesses"
          legend={t("weakness")}
          options={[
            { value: "timing", label: t("weakTiming") },
            { value: "chords", label: t("weakChords") },
            { value: "notes", label: t("weakNotes") },
            { value: "confidence", label: t("weakConfidence") },
          ]}
        />
      </div>
      <fieldset className="setup-block" hidden={step !== 9}>
        <legend className="setup-question">{t("agreeTitle")}</legend>
        <label className="setup-agree">
          <input type="checkbox" name="consent" value="yes" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          <span>
            {t("agreeLead")}{" "}
            <Link href={`/${locale}/terms`}>{t("terms")}</Link> {t("agreeAnd")}{" "}
            <Link href={`/${locale}/privacy`}>{t("privacy")}</Link>
          </span>
        </label>
      </fieldset>
      {error ? <p className="setup-error">{error}</p> : null}
      <StepNav
        step={step}
        total={total}
        canNext={ready[step] ?? false}
        last={step === total - 1}
        onBack={() => {
          setError(null);
          setStep((current) => current - 1);
        }}
        onNext={() => {
          setError(null);
          setStep((current) => current + 1);
        }}
      />
    </form>
  );
}

export function StudentOnboardingForm({
  defaultName,
  returnTo,
  locale,
  labels,
}: {
  defaultName: string;
  returnTo?: string;
  locale: "vi" | "en";
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
  const t = useTranslations("onboarding");
  const [step, setStep] = useState(0);
  const [name, setName] = useState(defaultName);
  const [playing, setPlaying] = useState("");
  const [work, setWork] = useState("");
  const [ageBand, setAgeBand] = useState("adult");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = 10;
  const ready = [name.trim().length > 0, true, true, true, playing !== "", work !== "", true, true, true, consent];

  return (
    <form
      action={async (form) => {
        const result = await saveStudentOnboarding(form);
        if (result?.error === "code") {
          setStep(3);
          setError(labels.badCode);
        } else if (result?.error) setError(labels.incomplete);
      }}
      className="setup"
    >
      {returnTo ? <input type="hidden" name="next" value={returnTo} /> : null}
      <Question hidden={step !== 0} prompt={labels.name}>
        <input
          required
          name="name"
          value={name}
          autoComplete="name"
          onChange={(event) => setName(event.target.value)}
          className="setup-field setup-field-name"
        />
      </Question>
      <div hidden={step !== 1}>
        <p className="setup-question">{t("photo")}</p>
        <AvatarUpload
          role="student"
          name={name || defaultName}
          label={t("photo")}
          help={t("photoHelp")}
          tooBig={t("photoTooBig")}
          failed={t("photoFailed")}
        />
      </div>
      <Question hidden={step !== 2} prompt={labels.age}>
        <Choices
          name="ageBand"
          value={ageBand}
          onChange={setAgeBand}
          options={[
            { value: "adult", label: labels.adult },
            { value: "under18", label: labels.under18 },
          ]}
        />
      </Question>
      <Question hidden={step !== 3} prompt={labels.q1}>
        <input name="code" placeholder={labels.codePlaceholder} autoComplete="off" className="setup-field" />
      </Question>
      <Question hidden={step !== 4} prompt={labels.q2}>
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
      </Question>
      <Question hidden={step !== 5} prompt={labels.q3}>
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
      </Question>
      <div hidden={step !== 6}>
        <PickMany
          name="skills"
          legend={t("skills")}
          options={[
            { value: "rhythm", label: t("skillRhythm") },
            { value: "chords", label: t("skillChords") },
            { value: "fingerstyle", label: t("skillFingerstyle") },
            { value: "reading", label: t("skillReading") },
            { value: "singing", label: t("skillSinging") },
          ]}
        />
      </div>
      <div hidden={step !== 7}>
        <PickMany
          name="weaknesses"
          legend={t("weakness")}
          options={[
            { value: "timing", label: t("weakTiming") },
            { value: "chords", label: t("weakChords") },
            { value: "notes", label: t("weakNotes") },
            { value: "confidence", label: t("weakConfidence") },
          ]}
        />
      </div>
      <Question hidden={step !== 8} prompt={labels.phone}>
        <input
          name="contactHandle"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={labels.phonePlaceholder}
          className="setup-field"
        />
        <input type="hidden" name="contactType" value="zalo" />
      </Question>
      <fieldset className="setup-block" hidden={step !== 9}>
        <legend className="setup-question">{t("agreeTitle")}</legend>
        <label className="setup-agree">
          <input type="checkbox" name="consent" value="yes" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          <span>
            {t("agreeLead")}{" "}
            <Link href={`/${locale}/terms`}>{t("terms")}</Link> {t("agreeAnd")}{" "}
            <Link href={`/${locale}/privacy`}>{t("privacy")}</Link>
          </span>
        </label>
      </fieldset>
      {error ? <p className="setup-error">{error}</p> : null}
      <StepNav
        step={step}
        total={total}
        canNext={ready[step] ?? false}
        last={step === total - 1}
        onBack={() => {
          setError(null);
          setStep((current) => current - 1);
        }}
        onNext={() => {
          setError(null);
          setStep((current) => current + 1);
        }}
      />
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
