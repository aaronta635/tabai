import type { User } from "@supabase/supabase-js";
import { deliverableAddress } from "@/lib/deliverable-email";

const ZALO_PLACEHOLDER = /^zalo_[a-z0-9]+@oauth\.para\.local$/i;

export const ZALO_RECOVERY_DISMISS_KEY = "para-zalo-recovery-dismissed";

export const ZALO_RECOVERY_MIN_PASSWORD = 6;

export type ZaloRecoveryErrorKey =
  | "emailTaken"
  | "weakPassword"
  | "invalidEmail"
  | "passwordMismatch"
  | "linkingDisabled"
  | "generic";

export function isZaloPlaceholderEmail(email: string | null | undefined) {
  const value = email?.trim().toLowerCase() ?? "";
  return ZALO_PLACEHOLDER.test(value);
}

export function hasGoogleIdentity(user: Pick<User, "identities" | "app_metadata">) {
  const fromIdentities = user.identities?.some((identity) => identity.provider === "google") ?? false;
  const providers = user.app_metadata?.providers;
  const fromMeta = Array.isArray(providers) && providers.includes("google");
  return fromMeta || fromIdentities;
}

/** Zalo sign-in used a fake email; the account still needs email/password or Google. */
export function needsZaloAccountRecovery(
  user: Pick<User, "email" | "identities" | "app_metadata"> | null | undefined,
) {
  if (!user) return false;
  if (hasGoogleIdentity(user)) return false;
  if (deliverableAddress(user.email)) return false;
  return isZaloPlaceholderEmail(user.email);
}

export function mapZaloRecoveryAuthError(message: string): ZaloRecoveryErrorKey {
  const lower = message.toLowerCase();
  if (lower.includes("manual linking") || lower.includes("manual_linking")) return "linkingDisabled";
  if (lower.includes("already") && (lower.includes("registered") || lower.includes("in use"))) {
    return "emailTaken";
  }
  if (lower.includes("password") && (lower.includes("weak") || lower.includes("short") || lower.includes("least"))) {
    return "weakPassword";
  }
  if (lower.includes("invalid") && lower.includes("email")) return "invalidEmail";
  return "generic";
}