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

/** How long the highlight story plays, starting at the moment the teacher marked. */
export const HIGHLIGHT_SECONDS = 8;

export function joinStoryLetter(parts: {
  progress?: string | null;
  keyPoint?: string | null;
  nextStep?: string | null;
}) {
  return [parts.progress, parts.keyPoint, parts.nextStep]
    .map((line) => (line ?? "").trim())
    .filter(Boolean)
    .join("\n\n");
}

export function highlightStart(value: unknown) {
  if (value == null || value === "") return null;
  const seconds = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 60 * 60) return null;
  return Math.round(seconds * 10) / 10;
}

export type ReportStory = {
  id: "practice" | "highlight" | "progress" | "key" | "next";
  tone: "ink" | "beat" | "butter" | "paper" | "wire";
  label: string;
  hero: string;
  detail: string;
  videoStart: number | null;
};

export function reportStories(
  input: {
    practices: number;
    takes: number;
    highlightStart: number | null;
    progress: string | null;
    keyPoint: string | null;
    nextStep: string | null;
  },
  copy: {
    storyPractice: string;
    storyHighlight: string;
    storyProgress: string;
    storyKey: string;
    storyNext: string;
    practiceMix: string;
    noPractice: string;
    noHighlight: string;
    noProgress: string;
    noKey: string;
    noNext: string;
  },
): ReportStory[] {
  const times = input.practices + input.takes;
  const line = (value: string | null, empty: string) => {
    const text = value?.trim() ?? "";
    return text || empty;
  };
  return [
    {
      id: "practice",
      tone: "ink",
      label: copy.storyPractice,
      hero: String(times),
      detail: times === 0 ? copy.noPractice : copy.practiceMix.replace("{practices}", String(input.practices)).replace("{takes}", String(input.takes)),
      videoStart: null,
    },
    {
      id: "highlight",
      tone: "beat",
      label: copy.storyHighlight,
      hero: input.highlightStart == null ? copy.noHighlight : "",
      detail: "",
      videoStart: input.highlightStart,
    },
    {
      id: "progress",
      tone: "butter",
      label: copy.storyProgress,
      hero: line(input.progress, copy.noProgress),
      detail: "",
      videoStart: null,
    },
    {
      id: "key",
      tone: "paper",
      label: copy.storyKey,
      hero: line(input.keyPoint, copy.noKey),
      detail: "",
      videoStart: null,
    },
    {
      id: "next",
      tone: "wire",
      label: copy.storyNext,
      hero: line(input.nextStep, copy.noNext),
      detail: "",
      videoStart: null,
    },
  ];
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
