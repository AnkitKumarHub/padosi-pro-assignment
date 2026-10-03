import type { Clock } from "../../lib/clock.ts";
import { ApiError } from "../../lib/errors.ts";
import { signToken } from "../../lib/jwt.ts";
import type { Mailer } from "../../lib/mailer.ts";
import {
  generateOtpCode,
  hashOtpCode,
  otpCodeMatches,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
  resendAvailableInSeconds,
} from "../../lib/otp.ts";
import { onboardingStep } from "../../lib/onboarding.ts";
import { hashPassword, verifyPassword } from "../../lib/password.ts";
import type { AuthRepo } from "./repo.ts";

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" && err !== null && "code" in err && err.code === "23505"
  );
}

export function createAuthService(deps: {
  repo: AuthRepo;
  clock: Clock;
  mailer: Mailer;
  otpSecret: string;
  jwtSecret: string;
}) {
  const { repo, clock, mailer, otpSecret, jwtSecret } = deps;

  /** Issues a fresh code, stores only its HMAC, and emails the plaintext. */
  async function issueChallenge(userId: number, email: string, now: Date) {
    const code = generateOtpCode();
    await repo.replaceChallenge({
      userId,
      codeHash: hashOtpCode(code, otpSecret),
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      now,
    });
    await mailer.sendOtpCode(email, code);
  }

  return {
    async register(email: string, password: string) {
      const now = clock.now();

      if (await repo.findUserByEmail(email)) {
        throw new ApiError(
          409,
          "EMAIL_ALREADY_REGISTERED",
          "This email is already registered. Log in to finish verification.",
        );
      }

      const code = generateOtpCode();
      let user;
      try {
        user = await repo.createUserWithChallenge({
          email,
          passwordHash: await hashPassword(password),
          codeHash: hashOtpCode(code, otpSecret),
          expiresAt: new Date(now.getTime() + OTP_TTL_MS),
          now,
        });
      } catch (err) {
        // The unique index is the real guard; two parallel registrations both
        // pass the check above.
        if (isUniqueViolation(err)) {
          throw new ApiError(
            409,
            "EMAIL_ALREADY_REGISTERED",
            "This email is already registered. Log in to finish verification.",
          );
        }
        throw err;
      }

      await mailer.sendOtpCode(user.email, code);
      return {
        email: user.email,
        resendAvailableInSeconds: resendAvailableInSeconds(now, now),
      };
    },

    async verifyEmail(email: string, code: string) {
      const now = clock.now();
      const user = await repo.findUserByEmail(email);
      if (!user) {
        throw new ApiError(400, "OTP_NOT_FOUND", "No active code for this email.");
      }
      if (user.emailVerifiedAt) {
        throw new ApiError(
          409,
          "EMAIL_ALREADY_VERIFIED",
          "This email is already verified. You can log in.",
        );
      }

      const reserved = await repo.reserveOtpAttempt(user.id, now);
      if (!reserved) {
        // Nothing was reserved: classify why from the stored challenge.
        const challenge = await repo.findChallenge(user.id);
        if (!challenge || challenge.consumedAt) {
          throw new ApiError(400, "OTP_NOT_FOUND", "No active code for this email.");
        }
        if (challenge.expiresAt <= now) {
          throw new ApiError(
            400,
            "OTP_EXPIRED",
            "This code has expired. Request a new one.",
          );
        }
        throw new ApiError(
          429,
          "OTP_ATTEMPTS_EXCEEDED",
          "Too many incorrect attempts. Request a new code.",
          {
            resendAvailableInSeconds: resendAvailableInSeconds(
              challenge.lastSentAt,
              now,
            ),
          },
        );
      }

      if (otpCodeMatches(code, otpSecret, reserved.codeHash)) {
        const verified = await repo.consumeChallengeAndVerify(user.id, now);
        if (!verified) {
          throw new ApiError(400, "OTP_NOT_FOUND", "No active code for this email.");
        }
        return { email: user.email, emailVerified: true };
      }

      const challenge = await repo.findChallenge(user.id);
      if (reserved.attempts >= OTP_MAX_ATTEMPTS) {
        throw new ApiError(
          429,
          "OTP_ATTEMPTS_EXCEEDED",
          "Too many incorrect attempts. Request a new code.",
          {
            resendAvailableInSeconds: challenge
              ? resendAvailableInSeconds(challenge.lastSentAt, now)
              : 0,
          },
        );
      }
      throw new ApiError(400, "INVALID_OTP", "That code is not correct.");
    },

    async resendOtp(email: string) {
      const now = clock.now();
      const user = await repo.findUserByEmail(email);
      if (!user) {
        throw new ApiError(400, "OTP_NOT_FOUND", "No active code for this email.");
      }
      if (user.emailVerifiedAt) {
        throw new ApiError(
          409,
          "EMAIL_ALREADY_VERIFIED",
          "This email is already verified. You can log in.",
        );
      }

      const challenge = await repo.findChallenge(user.id);
      if (challenge) {
        const waitSeconds = resendAvailableInSeconds(challenge.lastSentAt, now);
        if (waitSeconds > 0) {
          throw new ApiError(
            429,
            "OTP_RESEND_COOLDOWN",
            `Please wait ${waitSeconds} seconds before requesting a new code.`,
            { resendAvailableInSeconds: waitSeconds },
          );
        }
      }

      await issueChallenge(user.id, user.email, now);
      return {
        email: user.email,
        resendAvailableInSeconds: resendAvailableInSeconds(now, now),
      };
    },

    async login(email: string, password: string) {
      const now = clock.now();
      const user = await repo.findUserByEmail(email);
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
      }

      // Verification state is revealed only to someone who knows the password.
      if (!user.emailVerifiedAt) {
        const challenge = await repo.findChallenge(user.id);
        throw new ApiError(
          403,
          "EMAIL_NOT_VERIFIED",
          "Verify your email before logging in.",
          {
            resendAvailableInSeconds: challenge
              ? resendAvailableInSeconds(challenge.lastSentAt, now)
              : 0,
          },
        );
      }

      const onboarding = await repo.getOnboardingState(user.id);
      return {
        token: signToken(user.id, jwtSecret, now),
        user: { id: user.id, email: user.email },
        onboardingStep: onboardingStep(
          onboarding ?? { hasProfile: false, taskSelectionCompletedAt: null },
        ),
      };
    },

    async currentUser(userId: number) {
      const user = await repo.findUserById(userId);
      if (!user) {
        throw new ApiError(401, "UNAUTHORIZED", "Your session has expired.");
      }
      const onboarding = await repo.getOnboardingState(userId);
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerifiedAt !== null,
        onboardingStep: onboardingStep(
          onboarding ?? { hasProfile: false, taskSelectionCompletedAt: null },
        ),
      };
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
