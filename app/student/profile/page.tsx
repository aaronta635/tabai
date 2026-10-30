import { ParaIcon } from "@/components/ui/para-icon";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { requireStudentAccount } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { signedMediaUrl } from "@/lib/media-view";
import { phoneKey } from "@/lib/phone";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { stringList, SKILLS, WEAKNESSES } from "@/lib/profile";
import { studentClasses } from "@/lib/student-view";
import { StudentProfileForm } from "@/components/profile/profile-editor";
import { JoinClassForm } from "@/components/student/join-class-form";
import { AddPanel } from "@/components/disclosure";

export default async function StudentProfilePage() {
  const student = await requireStudentAccount();
  if (!student) redirect(signInPath("student", "/student"));
  const locale = await getLocale();
  const t = await getMessages(locale);
  const classes = await studentClasses(student.id);
  const avatarSrc = await signedMediaUrl(student.avatarUrl);
  const answers =
    student.answersJson && typeof student.answersJson === "object" && !Array.isArray(student.answersJson)
      ? (student.answersJson as Record<string, unknown>)
      : {};

  return (
    <div className="student-profile space-y-5">
      <header>
        <h1 className="font-display text-3xl">{student.name}</h1>
      </header>
      <AvatarUpload
        role="student"
        name={student.name}
        current={avatarSrc}
        label={t.onboarding.photo}
        help={t.onboarding.photoHelp}
        tooBig={t.onboarding.photoTooBig}
        failed={t.onboarding.photoFailed}
      />

      <StudentProfileForm
        name={student.name}
        ageBand={student.ageBand}
        playing={answers.playing === "weeks" || answers.playing === "years" ? answers.playing : "months"}
        work={answers.work === "chords" || answers.work === "exam" ? answers.work : "song"}
        skills={stringList(answers.skills, SKILLS)}
        weaknesses={stringList(answers.weaknesses, WEAKNESSES)}
        contactHandle={phoneKey(student.contactHandle) ? student.contactHandle : ""}
      />

      <section className="tile space-y-3">
        <div>
          <p className="field-label">{t.student.email}</p>
          <p className="mt-1">{student.email ?? t.student.noEmail}</p>
        </div>
        <div>
          <p className="field-label">{t.student.yourClasses}</p>
          <ul className="mt-1 space-y-1">
            {classes.length === 0 ? (
              <li className="text-ink-soft">{t.student.stageExploring}</li>
            ) : (
              classes.map((row) => (
                <li key={row.id}>
                  <Link href={`/student/classes/${row.class.id}`} className="hover:text-beat">
                    {row.class.name} · {t.student.teacherLabel}: {row.class.teacher.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <AddPanel icon={<ParaIcon name="plus" />} label={t.student.joinAnother}>
        <JoinClassForm
          placeholder={t.home.codePlaceholder}
          submit={t.student.joinClass}
          badCode={t.onboarding.badCode}
        />
      </AddPanel>
    </div>
  );
}
