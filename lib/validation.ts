export type FieldErrors = Record<string, string>;

export const isRequired = (value: string) => value.trim().length > 0;

// List of known placeholder / dummy domains and reserved test domains (RFC 2606)
const DISALLOWED_EMAIL_DOMAINS = new Set([
  "email.com",
  "test.com",
  "example.com",
  "example.org",
  "example.net",
  "example.edu",
  "sample.com",
  "fake.com",
  "temp.com",
  "dummy.com",
  "invalid.com",
]);

const DISALLOWED_EMAIL_USERNAMES = new Set([
  "email",
  "test",
  "example",
  "sample",
  "demo",
  "fake",
  "dummy",
  "temp",
  "asdf",
  "qwerty",
  "abc",
  "xyz",
  "user",
  "username",
  "placeholder",
  "noemail",
  "none",
]);

export const isValidEmail = (value: string): boolean => {
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254) return false;

  // Strict email format: local-part@domain.tld
  // - local part: alphanumeric with . _ % + - (no leading/trailing dot, no consecutive dots)
  // - domain: valid domain labels separated by dots, TLD at least 2 letters
  const emailRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;

  if (email.includes("..")) return false;

  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return false;

  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];
  if (["test", "example", "invalid", "localhost"].includes(tld)) return false;

  if (DISALLOWED_EMAIL_DOMAINS.has(domain)) return false;

  const domainBase = domainParts[0];
  if (DISALLOWED_EMAIL_USERNAMES.has(localPart) && (localPart === domainBase || DISALLOWED_EMAIL_DOMAINS.has(domain))) {
    return false;
  }

  if (localPart === domainBase && ["mail", "admin", "name", "user", "info", "contact", "me", "my"].includes(localPart)) {
    return false;
  }

  return true;
};

// Accepts Indian 10-digit numbers, optionally with +91 / 0 prefix, spaces or dashes.
export const isValidPhone = (value: string) => {
  const digits = value.replace(/[\s-]/g, "");
  return /^(\+?91)?0?[6-9]\d{9}$/.test(digits);
};

export const isValidPincode = (value: string) => /^\d{6}$/.test(value.trim());

export const isValidQuantity = (value: string) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1;
};

/** Validates that a date string is formatted strictly as DD-MM-YYYY with exactly a 4-digit year and represents a real calendar date in the current/valid year window. */
export const isValidDate = (value: string) => {
  if (!value) return false;
  if (!/^(0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])-\d{4}$/.test(value)) return false;
  const [dayStr, monthStr, yearStr] = value.split("-");
  if (yearStr.length !== 4) return false;
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);

  // Year must be dynamically restricted to current year or the allowed future window year
  const currentYear = new Date().getFullYear();
  const maxYear = new Date(Date.now() + 120 * 86400000).getFullYear();
  if (year < currentYear || year > maxYear) return false;

  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
};

export const isFutureOrTodayDate = (value: string) => {
  if (!isValidDate(value)) return false;
  const [day, month, year] = value.split("-").map(Number);
  const chosen = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return chosen.getTime() >= today.getTime();
};

/** Rejects dates further out than `maxDays` from today — matches the server-side rule. */
export const isWithinFutureWindow = (maxDays: number) => (value: string) => {
  if (!isFutureOrTodayDate(value)) return false;
  const [day, month, year] = value.split("-").map(Number);
  const chosen = new Date(year, month - 1, day);
  const limit = new Date();
  limit.setHours(0, 0, 0, 0);
  limit.setDate(limit.getDate() + maxDays);
  return chosen.getTime() <= limit.getTime();
};

export const maxLength = (max: number) => (value: string) => value.trim().length <= max;

/** Optional-positive-number check — passes on empty (field is optional), fails on non-positive or non-numeric. */
export const isEmptyOrPositiveNumber = (value: string) => {
  if (!value.trim()) return true;
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
};

export const validate = (
  values: Record<string, string>,
  rules: Record<string, Array<(v: string) => boolean>>,
  messages: Record<string, string>
): FieldErrors => {
  const errors: FieldErrors = {};
  for (const field of Object.keys(rules)) {
    const value = values[field] ?? "";
    const failed = rules[field].some((rule) => !rule(value));
    if (failed) {
      errors[field] = messages[field] || "This field is invalid.";
    }
  }
  return errors;
};
