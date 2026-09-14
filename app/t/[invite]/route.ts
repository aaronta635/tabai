import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signTeacherSession } from "@/lib/auth";
import { TEACHER_COOKIE } from "@/lib/constants";
import { logEvent } from "@/lib/events";

export async function GET(request: NextRequest, context: { params: Promise<{ invite: string }> }) {
  const { invite } = await context.params;
  const teacher = await prisma.teacher.findUnique({ where: { inviteToken: invite } });
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  if (!teacher) {
    return NextResponse.redirect(new URL("/", origin));
  }

  const token = await signTeacherSession(teacher.id);
  await logEvent({
    name: "teacher.session",
    actorType: "teacher",
    actorId: teacher.id,
    teacherId: teacher.id,
  });

  const response = NextResponse.redirect(new URL("/teacher/queue", origin));
  response.cookies.set(TEACHER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
