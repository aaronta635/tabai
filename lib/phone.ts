import type { Locale } from "@/lib/locale-path";

/** VN mobile leading digit after the local 0 (not AU two-digit area codes). */
const VN_ONLY_SECOND = new Set(["5", "9"]);
const VN_NATIONAL = new Set(["3", "5", "7", "8", "9"]);
const AU_AREA_AFTER_ZERO = new Set(["02", "03", "07", "08"]);

function vnNational(national: string) {
  return national.length === 9 && VN_NATIONAL.has(national[0] ?? "");
}

function auNational(national: string) {
  return national.length === 9;
}

function keyFrom(country: "84" | "61", national: string) {
  if (country === "84" && !vnNational(national)) return null;
  if (country === "61" && !auNational(national)) return null;
  return `${country}${national}`;
}

function defaultCountry(locale: Locale): "84" | "61" {
  return locale === "en" ? "61" : "84";
}

function ambiguousAuLocal(digits: string) {
  return digits.length === 10 && digits.startsWith("0") && AU_AREA_AFTER_ZERO.has(digits.slice(0, 2));
}

function vnUnambiguousLocal(digits: string) {
  return (
    digits.length === 10 &&
    digits.startsWith("0") &&
    !digits.startsWith("04") &&
    !ambiguousAuLocal(digits) &&
    VN_ONLY_SECOND.has(digits[1] ?? "")
  );
}

function vnUnambiguousNine(digits: string) {
  return digits.length === 9 && VN_ONLY_SECOND.has(digits[0] ?? "");
}

/** Canonical digit key for uniqueness. Locale resolves ambiguous local numbers. */
export function phoneKey(raw: string, locale: Locale = "vi"): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.includes("@")) return null;

  const explicit = trimmed.startsWith("+");
  const digits = (explicit ? trimmed.slice(1) : trimmed).replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;

  if (explicit) {
    if (digits.startsWith("84")) {
      return vnNational(digits.slice(2)) ? digits : null;
    }
    if (digits.startsWith("61")) {
      return auNational(digits.slice(2)) ? digits : null;
    }
    return digits;
  }

  if (digits.length === 10 && digits.startsWith("0")) {
    if (digits.startsWith("04")) {
      return keyFrom("61", digits.slice(1));
    }
    if (ambiguousAuLocal(digits)) {
      return keyFrom(defaultCountry(locale), digits.slice(1));
    }
    if (vnUnambiguousLocal(digits)) {
      return keyFrom("84", digits.slice(1));
    }
    return keyFrom(defaultCountry(locale), digits.slice(1));
  }

  if (digits.length === 9) {
    if (digits.startsWith("4")) {
      return keyFrom("61", digits);
    }
    if (vnUnambiguousNine(digits)) {
      return keyFrom("84", digits);
    }
    return keyFrom(defaultCountry(locale), digits);
  }

  if (digits.length === 11 && digits.startsWith("84")) {
    return vnNational(digits.slice(2)) ? digits : null;
  }
  if (digits.length === 11 && digits.startsWith("61")) {
    return auNational(digits.slice(2)) ? digits : null;
  }

  return null;
}