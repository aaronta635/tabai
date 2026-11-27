export function deliverableAddress(email: string | null | undefined) {
  const value = email?.trim() ?? "";
  if (!value || value.toLowerCase().endsWith("@oauth.para.local")) return null;
  return value;
}