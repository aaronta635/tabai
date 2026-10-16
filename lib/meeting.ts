export type MeetingProvider = "google_meet" | "zoom";

export function meetingLink(provider: string | null | undefined, url: string | null | undefined) {
  const room = (provider ?? "").trim();
  const raw = (url ?? "").trim();
  if (!room && !raw) return null;
  if (room !== "google_meet" && room !== "zoom") return undefined;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== "https:") return undefined;
  const host = parsed.hostname.toLowerCase();
  if (room === "google_meet" && host !== "meet.google.com") return undefined;
  if (room === "zoom" && host !== "zoom.us" && !host.endsWith(".zoom.us")) return undefined;
  return { provider: room as MeetingProvider, url: parsed.toString() };
}
