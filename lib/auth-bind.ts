import type { AccountRole } from "@/lib/onboarding";

export type AuthBindDecision =
  | { action: "use"; role: AccountRole }
  | { action: "create"; role: AccountRole }
  | { action: "mismatch"; actual: AccountRole };

/**
 * Pick a local profile from the sign-in screen the person used.
 * An existing tutor is never opened from student login, and the reverse.
 */
export function resolveAuthBind(input: {
  requested?: AccountRole | null;
  hasTeacher: boolean;
  hasStudent: boolean;
  fallbackRole: AccountRole;
}): AuthBindDecision {
  const { requested, hasTeacher, hasStudent, fallbackRole } = input;

  if (requested === "student") {
    if (hasStudent) return { action: "use", role: "student" };
    if (hasTeacher) return { action: "mismatch", actual: "tutor" };
    return { action: "create", role: "student" };
  }

  if (requested === "tutor") {
    if (hasTeacher) return { action: "use", role: "tutor" };
    if (hasStudent) return { action: "mismatch", actual: "student" };
    return { action: "create", role: "tutor" };
  }

  if (hasTeacher) return { action: "use", role: "tutor" };
  if (hasStudent) return { action: "use", role: "student" };
  return { action: "create", role: fallbackRole };
}
