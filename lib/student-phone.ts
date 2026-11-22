import type { Locale } from "@/lib/locale-path";
import { prisma } from "@/lib/prisma";
import { phoneKey } from "@/lib/phone";

/** Pre-locale-fix AU mobiles were stored as `84` + nine digits after dropping the leading 0. */
export function legacyMisKeyedAuAliases(key: string): string[] {
  if (key.startsWith("61") && key.length === 11 && key[2] === "4") {
    return [key, `84${key.slice(2)}`];
  }
  return [key];
}

export async function phoneIsTaken(key: string, exceptId?: string) {
  const keys = legacyMisKeyedAuAliases(key);
  const taken = await prisma.student.findFirst({
    where: {
      phoneKey: { in: keys },
      ...(exceptId ? { NOT: { id: exceptId } } : {}),
    },
    select: { id: true },
  });
  return Boolean(taken);
}

/** A real phone, unique among students. Empty and non-phone text are refused. */
export async function claimPhone(raw: string, exceptId?: string, locale: Locale = "vi") {
  const key = phoneKey(raw, locale);
  if (!key) return { error: "phone" as const };
  if (await phoneIsTaken(key, exceptId)) return { error: "phone_taken" as const };
  return { contactHandle: raw.trim(), phoneKey: key };
}