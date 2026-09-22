// Sessions are stored and shown in UTC, so the string never shifts with the reader's device.
// Day always leads, in both locales, so a column of dates scans the same way.
function formatter(locale: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", { ...options, timeZone: "UTC" });
}

export function formatDay(value: Date, locale: string) {
  return formatter(locale, { day: "2-digit", month: "short" }).format(value);
}

export function formatTime(value: Date, locale: string) {
  return formatter(locale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(value);
}

export function formatWhen(value: Date, locale: string) {
  return `${formatDay(value, locale)} · ${formatTime(value, locale)}`;
}
