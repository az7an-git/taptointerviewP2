import { isValidPhoneNumber as libIsValidPhoneNumber } from "libphonenumber-js";

export function isValidPhoneNumber(phone: string): boolean {
  return Boolean(phone) && libIsValidPhoneNumber(phone);
}

/** Normalize a phone string to E.164, defaulting bare 10-digit numbers to US (+1). */
export function formatPhoneE164(phone: string): string {
  const raw = phone.replace(/\s/g, "");

  if (raw.startsWith("+")) {
    const afterPlus = raw.slice(1).replace(/\D/g, "");
    if (/^1\d{10}$/.test(afterPlus)) return `+${afterPlus}`;
    if (/^\d{10}$/.test(afterPlus)) return `+1${afterPlus}`;
    return `+${afterPlus}`;
  }

  const digits = raw.replace(/\D/g, "");
  if (/^\d{10}$/.test(digits)) return `+1${digits}`;
  if (/^1\d{10}$/.test(digits)) return `+${digits}`;
  return `+${digits}`;
}
