"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateStudentProfile } from "@/app/onboarding/actions";
import { updateTeacherProfile } from "@/app/teacher/lms-actions";
import { SkillPicks } from "@/components/onboarding/onboarding-form";
import { PickOne } from "@/components/profile/picks";

type Shared = {
  name: string;
  skills: string[];
  weaknesses: string[];
};

export function TeacherProfileForm({
  name,
  teaching,
  skills,
  weaknesses,
  email,
  paymentUrl,
}: Shared & { teaching: string; email: string | null; paymentUrl: string }) {
  const t = useTranslations("onboarding");
  const teacher = useTranslations("teacher");
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="tile space-y-5"
      action={async (form) => {
        await updateTeacherProfile(form);
        setSaved(true);
      }}
    >
      <label className="block">
        <span className="field-label">{t("name")}</span>
        <input name="name" required defaultValue={name} className="field mt-1.5" />
      </label>
      <PickOne
        name="teaching"
        legend={t("timeTeaching")}
        initial={teaching}
        options={[
          { value: "new", label: t("teachingNew") },
          { value: "some", label: t("teachingSome") },
          { value: "long", label: t("teachingLong") },
        ]}
      />
      <SkillPicks skills={skills} weaknesses={weaknesses} />
      <label className="block">
        <span className="field-label">{teacher("paymentUrl")}</span>
        <input name="paymentUrl" defaultValue={paymentUrl} placeholder="https://" className="field mt-1.5" />
        <p className="mt-1.5 text-sm text-ink-soft">{teacher("paymentHint")}</p>
      </label>
      <p className="text-sm text-ink-soft">
        {teacher("profileEmail")}: {email || "—"}
      </p>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn">
          {teacher("saveProfile")}
        </button>
        {saved ? <p className="text-sm text-ink-soft">{t("saved")}</p> : null}
      </div>
    </form>
  );
}

export function StudentProfileForm({
  name,
  ageBand,
  playing,
  work,
  skills,
  weaknesses,
  contactHandle,
}: Shared & {
  ageBand: string;
  playing: string;
  work: string;
  contactHandle: string;
}) {
  const t = useTranslations("onboarding");
  const student = useTranslations("student");
  const teacher = useTranslations("teacher");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="tile space-y-5"
      action={async (form) => {
        const result = await updateStudentProfile(form);
        if (result?.error === "phone_taken") {
          setSaved(false);
          setError(t("phoneTaken"));
          return;
        }
        if (result?.error) {
          setSaved(false);
          setError(t("phoneRequired"));
          return;
        }
        setError(null);
        setSaved(true);
      }}
    >
      <label className="block">
        <span className="field-label">{t("name")}</span>
        <input name="name" required defaultValue={name} className="field mt-1.5" />
      </label>
      <PickOne
        name="ageBand"
        legend={student("age")}
        initial={ageBand}
        options={[
          { value: "under18", label: student("under18") },
          { value: "adult", label: student("adult") },
        ]}
      />
      <PickOne
        name="playing"
        legend={t("timePlayed")}
        initial={playing}
        options={[
          { value: "weeks", label: t("playingWeeks") },
          { value: "months", label: t("playingMonths") },
          { value: "years", label: t("playingYears") },
        ]}
      />
      <PickOne
        name="work"
        legend={t("studentQ3")}
        initial={work}
        options={[
          { value: "chords", label: t("workChords") },
          { value: "song", label: t("workSong") },
          { value: "exam", label: t("workExam") },
        ]}
      />
      <SkillPicks skills={skills} weaknesses={weaknesses} />
      <label className="block">
        <span className="field-label">{t("phone")}</span>
        <input
          required
          name="contactHandle"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t("phonePlaceholder")}
          defaultValue={contactHandle}
          className="field mt-1.5"
        />
      </label>
      {error ? <p className="setup-error">{error}</p> : null}
      <div className="flex items-center gap-3">
        <button type="submit" className="btn">
          {teacher("saveProfile")}
        </button>
        {saved ? <p className="text-sm text-ink-soft">{t("saved")}</p> : null}
      </div>
    </form>
  );
}
