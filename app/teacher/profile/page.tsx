import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getMessages } from "@/lib/i18n";
import { signedMediaUrl } from "@/lib/media-view";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { stringList, SKILLS, TEACHING_SPAN, WEAKNESSES } from "@/lib/profile";
import { StudioTitle } from "@/components/home/feed";
import { TeacherProfileForm } from "@/components/profile/profile-editor";

export default async function TeacherProfilePage() {
  const session = await readTeacherSession();
  if (!session) redirect(signInPath("tutor", "/teacher"));
  const teacher = await prisma.teacher.findUnique({
    where: { id: session.id },
    select: { name: true, email: true, answersJson: true, paymentUrl: true, avatarUrl: true },
  });
  if (!teacher) redirect(signInPath("tutor", "/teacher"));
  const locale = await getLocale();
  const t = await getMessages(locale);
  const answers =
    teacher.answersJson && typeof teacher.answersJson === "object" && !Array.isArray(teacher.answersJson)
      ? (teacher.answersJson as Record<string, unknown>)
      : {};
  const avatarSrc = await signedMediaUrl(teacher.avatarUrl);
  const teaching = TEACHING_SPAN.includes(answers.teaching as (typeof TEACHING_SPAN)[number])
    ? String(answers.teaching)
    : "some";

  return (
    <div className="space-y-6">
      <header>
        <StudioTitle title={teacher.name} />
      </header>
      <AvatarUpload
        role="teacher"
        name={teacher.name}
        current={avatarSrc}
        label={t.onboarding.photo}
        help={t.onboarding.photoHelp}
        tooBig={t.onboarding.photoTooBig}
        failed={t.onboarding.photoFailed}
      />
      <TeacherProfileForm
        name={teacher.name}
        email={teacher.email}
        teaching={teaching}
        skills={stringList(answers.skills, SKILLS)}
        weaknesses={stringList(answers.weaknesses, WEAKNESSES)}
        paymentUrl={teacher.paymentUrl ?? ""}
      />
    </div>
  );
}
