import { newInviteToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const DEMO_TEACHER_NAME = "PARA practice";
export const PARA_SENDER_NAME = "PARA";

/** Students see PARA. The catalog account name stays off their screens. */
export function senderName(name: string, demo: boolean) {
  return demo ? PARA_SENDER_NAME : name;
}

/** The studio that owns demo files. Students are not members of it. */
export async function ensureDemoTeacherId() {
  const fromEnv = process.env.CATALOG_TEACHER_ID;
  if (fromEnv) {
    const named = await prisma.teacher.findUnique({ where: { id: fromEnv }, select: { id: true } });
    if (named) return named.id;
  }
  const existing = await prisma.teacher.findFirst({
    where: { name: DEMO_TEACHER_NAME },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.teacher.create({
    data: { name: DEMO_TEACHER_NAME, inviteToken: newInviteToken(), onboardedAt: new Date() },
    select: { id: true },
  });
  return created.id;
}
