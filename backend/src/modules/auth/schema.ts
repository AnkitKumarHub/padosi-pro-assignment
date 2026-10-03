import { z } from "zod";

// Trim and lowercase first, then validate, so " A@B.com " is accepted.
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address.").max(254));

// Not trimmed: a leading or trailing space is part of the password.
const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Password must be at most 72 bytes.",
  );

// A string, not a number, so a code such as 004217 keeps its leading zeros.
const otpCode = z.string().regex(/^\d{6}$/, "Enter the 6-digit code.");

export const registerBody = z.strictObject({ email, password });
export const verifyEmailBody = z.strictObject({ email, code: otpCode });
export const resendOtpBody = z.strictObject({ email });
export const loginBody = z.strictObject({ email, password });
