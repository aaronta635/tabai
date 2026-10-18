import { NextRequest, NextResponse } from "next/server";
import { originFromRequest } from "@/lib/app-origin";
import { prisma } from "@/lib/prisma";
import { signInPath } from "@/lib/return-path";

export async function GET(request: NextRequest, context: { params: Promise<{ invite: string }> }) {
  const { invite } = await context.params;
  const teacher = await prisma.teacher.findUnique({ where: { inviteToken: invite } });
  const origin = originFromRequest(request);
  if (!teacher) {
    return NextResponse.redirect(new URL("/", origin));
  }
  if (teacher.authUserId) {
    return NextResponse.redirect(new URL("/login/teacher", origin));
  }
  return NextResponse.redirect(new URL(signInPath("tutor", `/t/${invite}`), origin));
}
