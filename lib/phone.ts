import type { Locale } from "@/lib/locale-path";

const VN_LEADING = new Set(["3", "5", "7", "8", "9"]);

function vnNational(national: string) {
  return national.length === 9 && VN_LEADING.has(national[0] ?? "");
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
    if (VN_LEADING.has(digits[1] ?? "")) {
      return keyFrom("84", digits.slice(1));
    }
    return keyFrom(defaultCountry(locale), digits.slice(1));
  }

  if (digits.length === 9) {
    if (digits.startsWith("4")) {
      return keyFrom("61", digits);
    }
    if (VN_LEADING.has(digits[0] ?? "")) {
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