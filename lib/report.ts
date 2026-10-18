import { nanoid } from "nanoid";

export type Milestone = "first_take" | "first_reply" | "streak_3";

export function newReportToken() {
  return nanoid(24);
}

/** One line for the parent and the student. The longest streak wins, then the first reply, then the first take. */
export function milestoneOf(input: { takes: number; replies: number; streak: number }): Milestone | null {
  if (input.streak >= 3) return "streak_3";
  if (input.replies >= 1) return "first_reply";
  if (input.takes >= 1) return "first_take";
  return null;
}

export function milestoneText(
  kind: Milestone,
  copy: { milestoneStreak: string; milestoneFirstReply: string; milestoneFirstTake: string },
) {
  if (kind === "streak_3") return copy.milestoneStreak;
  if (kind === "first_reply") return copy.milestoneFirstReply;
  return copy.milestoneFirstTake;
}

export function weekLabel(start: Date, locale: string) {
  const end = new Date(start.getTime());
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

/** Only a real http(s) link is stored or shown. Anything else stays off the report. */
export function safePaymentUrl(value: string | null | undefined) {
  const raw = value?.trim() ?? "";
  if (!raw || raw.length > 500) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
