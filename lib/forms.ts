export function requiredText(value: string | null | undefined) {
  return (value ?? "").trim();
}

const SUBMISSION_NOTE_MAX = 800;

/** Empty stays unset. A note over 800 characters is rejected. */
export function submissionNote(value: unknown) {
  if (value == null) return null;
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (!text) return null;
  if (text.length > SUBMISSION_NOTE_MAX) return undefined;
  return text;
}

export function pieceTitleResult(title: string) {
  const trimmed = requiredText(title);
  if (!trimmed) return { error: "title_required" as const };
  return { title: trimmed };
}

const LETTER_GRADES = new Set(["A", "B", "C", "D", "F"]);

/** Empty stays unset. A–F (no E) is stored. Anything else is rejected. */
export function replyGrade(value: string | null | undefined) {
  const trimmed = (value ?? "").trim().toUpperCase();
  if (!trimmed) return null;
  if (!LETTER_GRADES.has(trimmed)) return undefined;
  return trimmed;
}

export function guardReply(input: {
  text: string;
  status: string;
  existingReplyCount: number;
}) {
  const text = requiredText(input.text);
  if (!text) return { error: "empty_reply" as const };
  if (input.status === "answered" || input.status === "skipped" || input.existingReplyCount > 0) {
    return { error: "stale_item" as const };
  }
  return { text };
}

/** A taken-back reply returns to the draft desk when a draft is still there. */
export function statusAfterRevert(hasDraft: boolean) {
  return hasDraft ? "drafted" : "new";
}

export const CLAIMABLE_SUBMISSION_STATUSES = ["new", "drafted"] as const;

export function isClaimableStatus(
  status: string,
): status is (typeof CLAIMABLE_SUBMISSION_STATUSES)[number] {
  return status === "new" || status === "drafted";
}

export function registerFieldErrors(input: {
  name?: string | null;
  contactHandle?: string | null;
  ageBand?: unknown;
  contactType?: unknown;
  consent?: unknown;
}) {
  const name = requiredText(input.name);
  const contactHandle = requiredText(input.contactHandle);
  return {
    missing: !name || !input.ageBand || !input.contactType || !contactHandle || !input.consent,
    name,
    contactHandle,
    fields: { name: !name, contactHandle: !contactHandle },
  };
}
