import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

/** randomInt is the CSPRNG; Math.random would be guessable. */
export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtpCode(code: string, secret: string): string {
  return createHmac("sha256", secret).update(code).digest("hex");
}

export function otpCodeMatches(
  code: string,
  secret: string,
  storedHash: string,
): boolean {
  const candidate = Buffer.from(hashOtpCode(code, secret), "hex");
  const stored = Buffer.from(storedHash, "hex");
  return (
    candidate.length === stored.length && timingSafeEqual(candidate, stored)
  );
}

/** Rounded up and never negative, so the client can count down to Resend. */
export function resendAvailableInSeconds(lastSentAt: Date, now: Date): number {
  const remainingMs = lastSentAt.getTime() + OTP_RESEND_COOLDOWN_MS - now.getTime();
  return Math.max(0, Math.ceil(remainingMs / 1000));
}
