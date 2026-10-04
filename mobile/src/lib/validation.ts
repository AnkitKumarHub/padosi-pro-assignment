// Mirrors the server field contract (SPEC section 7.3) so the user sees errors before a request.
// The server revalidates everything; these rules only save a round trip.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

// bcrypt truncates past 72 bytes, so the limit is bytes and not characters.
function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (code <= 0x7f) bytes += 1;
    else if (code <= 0x7ff) bytes += 2;
    else if (code <= 0xffff) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}

export function validateEmail(raw: string): string | null {
  const email = normalizeEmail(raw);
  if (email.length === 0) return "Enter your email address.";
  if (email.length > MAX_EMAIL_LENGTH) return "Enter a valid email address.";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  return null;
}

// Not trimmed: a leading or trailing space is part of the password.
export function validatePassword(password: string): string | null {
  if (password.length === 0) return "Enter a password.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (utf8ByteLength(password) > MAX_PASSWORD_BYTES) {
    return `Password must be at most ${MAX_PASSWORD_BYTES} bytes.`;
  }
  return null;
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | null {
  if (confirmation.length === 0) return "Confirm your password.";
  if (password !== confirmation) return "Passwords do not match.";
  return null;
}

// A string, not a number, so a code such as 004217 keeps its leading zeros.
export function validateOtpCode(code: string): string | null {
  if (code.length === 0) return "Enter the 6-digit code.";
  if (!/^\d{6}$/.test(code)) return "Enter the 6-digit code.";
  return null;
}

export function validateServerUrl(raw: string): string | null {
  const url = raw.trim();
  if (url.length === 0) return "Enter the API base URL.";
  if (!/^https?:\/\/\S+$/.test(url)) return "The URL must start with http:// or https://";
  return null;
}

const MAX_NAME_LENGTH = 80;
const MAX_ADDRESS_LENGTH = 300;
const MAX_BUSINESS_NAME_LENGTH = 120;

export function validateProfileName(raw: string): string | null {
  const name = raw.trim();
  if (name.length === 0) return "Name is required.";
  if (name.length > MAX_NAME_LENGTH) return `Name must be at most ${MAX_NAME_LENGTH} characters.`;
  return null;
}

export function validateProfileMobileDigits(digits: string): string | null {
  if (digits.length === 0) return "Mobile number is required.";
  if (!/^\d{10}$/.test(digits)) return "Enter 10 digits after +91.";
  return null;
}

export function toCanonicalMobile(digits: string): string {
  return `+91${digits}`;
}

export function validateProfileAddress(raw: string): string | null {
  const address = raw.trim();
  if (address.length === 0) return "Address is required.";
  if (address.length > MAX_ADDRESS_LENGTH) {
    return `Address must be at most ${MAX_ADDRESS_LENGTH} characters.`;
  }
  return null;
}

export function validateBusinessName(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > MAX_BUSINESS_NAME_LENGTH) {
    return `Business name must be at most ${MAX_BUSINESS_NAME_LENGTH} characters.`;
  }
  return null;
}

export function parseTaskIdParams(raw: string | undefined): number[] {
  if (!raw || raw.length === 0) return [];
  const ids = raw
    .split(",")
    .map((part) => Number.parseInt(part, 10))
    .filter((id) => Number.isInteger(id) && id > 0);
  return [...new Set(ids)];
}
