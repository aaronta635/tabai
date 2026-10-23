import Link from "next/link";
import { PieceCodeForm } from "@/components/landing/piece-code-form";
import { getTeacherFromCookie, getStudentFromCookie } from "@/lib/auth";
import { getMessages } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/site/content";

export async function StudioEntry({ locale }: { locale: Locale }) {
  const messages = await getMessages(locale);
  const t = messages.home;
  const teacher = await getTeacherFromCookie();
  const student = await getStudentFromCookie();
  const teacherHref = localePath(locale, teacher ? "/teacher" : "/login/teacher");
  const studentHref = localePath(locale, student ? "/student" : "/login/student");

  return (
    <div className="studio-entry-block">
      <p className="form-note">{t.studentEntry}</p>
      <PieceCodeForm placeholder={t.codePlaceholder} submit={t.openPiece} variant="site" />
      <div className="hero-actions">
        <Link className="text-link" href={teacherHref}>
          {teacher ? t.navOpen : t.tutorCta}
        </Link>
        <Link className="text-link" href={studentHref}>
          {student ? t.navOpen : t.studentCta}
        </Link>
      </div>
    </div>
  );
}
