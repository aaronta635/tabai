import { prisma } from "@/lib/prisma";
import { phoneKey } from "@/lib/phone";

export async function phoneIsTaken(key: string, exceptId?: string) {
  const taken = await prisma.student.findFirst({
    where: {
      phoneKey: key,
      ...(exceptId ? { NOT: { id: exceptId } } : {}),
    },
    select: { id: true },
  });
  return Boolean(taken);
}

/** A real phone, unique among students. Empty and non-phone text are refused. */
export async function claimPhone(raw: string, exceptId?: string) {
  const key = phoneKey(raw);
  if (!key) return { error: "phone" as const };
  if (await phoneIsTaken(key, exceptId)) return { error: "phone_taken" as const };
  return { contactHandle: raw.trim(), phoneKey: key };
}
