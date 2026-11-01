/** Digits only. A local 0-prefix mobile becomes the same key as its 84-prefix form. */
export function phoneKey(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  if (digits.length === 10 && digits.startsWith("0")) return `84${digits.slice(1)}`;
  return digits;
}
