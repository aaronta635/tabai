import { Prisma } from "@prisma/client";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { formatDueLabel } from "@/lib/practice";
import { productOrigin } from "@/lib/sites";

const FROM = "PARA <info@paramuzic.com>";

type MailLocale = "en" | "vi";

export function deliverableAddress(email: string | null | undefined) {
  const value = email?.trim() ?? "";
  if (!value || value.toLowerCase().endsWith("@oauth.para.local")) return null;
  return value;
}

function mailLocale(value: string | null | undefined): MailLocale {
  return value === "en" ? "en" : "vi";
}

function studioUrl(locale: MailLocale, path: string) {
  return `${productOrigin().replace(/\/$/, "")}/${locale}${path}`;
}

export function assignmentLetter(input: {
  locale: MailLocale;
  pieceTitle: string;
  teacherName: string;
  dueLabel: string;
  url: string;
}) {
  switch (input.locale) {
    case "en":
      return {
        subject: `New song: ${input.pieceTitle}`,
        text: `${input.teacherName} assigned ${input.pieceTitle}. Due ${input.dueLabel}.\n\nOpen the piece: ${input.url}`,
      };
    case "vi":
      return {
        subject: `Bài mới: ${input.pieceTitle}`,
        text: `${input.teacherName} vừa giao bài ${input.pieceTitle}. Hạn ${input.dueLabel}.\n\nMở bài: ${input.url}`,
      };
    default: {
      const unreachable: never = input.locale;
      return unreachable;
    }
  }
}

export function replyLetter(input: { locale: MailLocale; pieceTitle: string; url: string }) {
  switch (input.locale) {
    case "en":
      return {
        subject: `Feedback: ${input.pieceTitle}`,
        text: `There is feedback on ${input.pieceTitle}.\n\nOpen the take: ${input.url}`,
      };
    case "vi":
      return {
        subject: `Góp ý: ${input.pieceTitle}`,
        text: `Có góp ý cho bài ${input.pieceTitle}.\n\nXem lần tập: ${input.url}`,
      };
    default: {
      const unreachable: never = input.locale;
      return unreachable;
    }
  }
}

async function claimAndSend(input: {
  kind: "assignment" | "reply";
  dedupeKey: string;
  studentId: string;
  to: string;
  subject: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;
  try {
    await prisma.outboundEmail.create({
      data: {
        kind: input.kind,
        dedupeKey: input.dedupeKey,
        studentId: input.studentId,
        toAddress: input.to,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    return;
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    if (error) throw new Error(error.message);
  } catch {
    await prisma.outboundEmail.deleteMany({ where: { dedupeKey: input.dedupeKey } }).catch(() => undefined);
  }
}

export async function notifyAssignments(assignmentIds: string[]) {
  if (assignmentIds.length === 0) return;
  try {
    const rows = await prisma.assignment.findMany({
      where: { id: { in: assignmentIds } },
      select: {
        id: true,
        dueAt: true,
        student: { select: { id: true, email: true } },
        class: {
          select: {
            memberships: {
              where: { approvedAt: { not: null }, studentId: { not: null } },
              select: { student: { select: { id: true, email: true } } },
            },
          },
        },
        piece: {
          select: {
            title: true,
            code: true,
            teacher: { select: { name: true, feedbackLocale: true } },
          },
        },
      },
    });
    for (const row of rows) {
      if (!row.piece || !row.dueAt) continue;
      const locale = mailLocale(row.piece.teacher.feedbackLocale);
      const letter = assignmentLetter({
        locale,
        pieceTitle: row.piece.title,
        teacherName: row.piece.teacher.name,
        dueLabel: formatDueLabel(row.dueAt, locale),
        url: studioUrl(locale, `/student/work/${row.piece.code}`),
      });
      const people = row.student
        ? [row.student]
        : row.class?.memberships.flatMap((member) => (member.student ? [member.student] : [])) ?? [];
      const seen = new Set<string>();
      for (const person of people) {
        if (seen.has(person.id)) continue;
        seen.add(person.id);
        const to = deliverableAddress(person.email);
        if (!to) continue;
        await claimAndSend({
          kind: "assignment",
          dedupeKey: `assignment:${row.id}:${person.id}`,
          studentId: person.id,
          to,
          subject: letter.subject,
          text: letter.text,
        });
      }
    }
  } catch {
    return;
  }
}

export async function notifyReply(replyId: string) {
  try {
    const reply = await prisma.reply.findUnique({
      where: { id: replyId },
      select: {
        id: true,
        submission: {
          select: {
            id: true,
            student: { select: { id: true, email: true } },
            piece: { select: { title: true, teacher: { select: { feedbackLocale: true } } } },
          },
        },
      },
    });
    const student = reply?.submission.student;
    const piece = reply?.submission.piece;
    if (!reply || !student || !piece) return;
    const to = deliverableAddress(student.email);
    if (!to) return;
    const locale = mailLocale(piece.teacher.feedbackLocale);
    const letter = replyLetter({
      locale,
      pieceTitle: piece.title,
      url: studioUrl(locale, `/student/takes/${reply.submission.id}`),
    });
    await claimAndSend({
      kind: "reply",
      dedupeKey: `reply:${reply.id}`,
      studentId: student.id,
      to,
      subject: letter.subject,
      text: letter.text,
    });
  } catch {
    return;
  }
}
