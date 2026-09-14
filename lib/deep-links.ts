export function zaloNudgeLink(handle: string) {
  const trimmed = handle.replace(/\s+/g, "");
  const phone = trimmed.replace(/^\+/, "");
  return `https://zalo.me/${phone}`;
}

export function messengerNudgeLink(handle: string) {
  if (handle.startsWith("http")) return handle;
  return `https://m.me/${handle.replace(/^@/, "")}`;
}

export function nudgeHref(type: "zalo" | "messenger" | null | undefined, handle: string | null | undefined) {
  if (!type || !handle) return null;
  return type === "zalo" ? zaloNudgeLink(handle) : messengerNudgeLink(handle);
}

export const NUDGE_MESSAGE =
  "Thầy đã nhận xét, xem tại link";
