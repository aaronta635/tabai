export function requiredText(value: string | null | undefined) {
  return (value ?? "").trim();
}

export function pieceTitleResult(title: string) {
  const trimmed = requiredText(title);
  if (!trimmed) return { error: "title_required" as const };
  return { title: trimmed };
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

export const CLAIMABLE_SUBMISSION_STATUSES = ["new", "drafted"] as const;

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
