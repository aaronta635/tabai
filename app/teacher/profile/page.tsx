import { redirect } from "next/navigation";
import { signInPath } from "@/lib/return-path";
import { readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initialsOf } from "@/lib/initials";
import { stringList, SKILLS, TEACHING_SPAN, WEAKNESSES } from "@/lib/profile";
import { TeacherProfileForm } from "@/components/profile/profile-editor";

export default async function TeacherProfilePage() {
  const session = await readTeacherSession();
  if (!session) redirect(signInPath("tutor", "/teacher"));
  const teacher = await prisma.teacher.findUnique({
    where: { id: session.id },
    select: { name: true, email: true, answersJson: true },
  });
  if (!teacher) redirect(signInPath("tutor", "/teacher"));
  const answers =
    teacher.answersJson && typeof teacher.answersJson === "object" && !Array.isArray(teacher.answersJson)
      ? (teacher.answersJson as Record<string, unknown>)
      : {};
  const teaching = TEACHING_SPAN.includes(answers.teaching as (typeof TEACHING_SPAN)[number])
    ? String(answers.teaching)
    : "some";

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <span className="avatar-btn font-ui" aria-hidden>
          {initialsOf(teacher.name)}
        </span>
        <h1 className="font-display text-3xl">{teacher.name}</h1>
      </header>
      <TeacherProfileForm
        name={teacher.name}
        email={teacher.email}
        teaching={teaching}
        skills={stringList(answers.skills, SKILLS)}
        weaknesses={stringList(answers.weaknesses, WEAKNESSES)}
      />
    </div>
  );
}
