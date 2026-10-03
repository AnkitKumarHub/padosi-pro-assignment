import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { otpChallenges, profiles, users } from "../../db/schema.ts";
import { OTP_MAX_ATTEMPTS } from "../../lib/otp.ts";

export type Challenge = {
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
  lastSentAt: Date;
};

export function createAuthRepo(db: Db) {
  return {
    async findUserByEmail(email: string) {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user ?? null;
    },

    async findUserById(id: number) {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user ?? null;
    },

    async getOnboardingState(userId: number) {
      const user = await this.findUserById(userId);
      if (!user) return null;
      const [profile] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(eq(profiles.userId, userId));
      return {
        hasProfile: profile !== undefined,
        taskSelectionCompletedAt: user.taskSelectionCompletedAt,
      };
    },

    async findChallenge(userId: number): Promise<Challenge | null> {
      const [challenge] = await db
        .select()
        .from(otpChallenges)
        .where(eq(otpChallenges.userId, userId));
      return challenge ?? null;
    },

    /** Creates the account and its first challenge together. */
    async createUserWithChallenge(input: {
      email: string;
      passwordHash: string;
      codeHash: string;
      expiresAt: Date;
      now: Date;
    }) {
      return db.transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({ email: input.email, passwordHash: input.passwordHash })
          .returning();
        await tx.insert(otpChallenges).values({
          userId: user!.id,
          codeHash: input.codeHash,
          expiresAt: input.expiresAt,
          lastSentAt: input.now,
        });
        return user!;
      });
    },

    /** A resend resets the code, the expiry and the five-attempt allowance. */
    async replaceChallenge(input: {
      userId: number;
      codeHash: string;
      expiresAt: Date;
      now: Date;
    }) {
      await db
        .insert(otpChallenges)
        .values({
          userId: input.userId,
          codeHash: input.codeHash,
          expiresAt: input.expiresAt,
          lastSentAt: input.now,
        })
        .onConflictDoUpdate({
          target: otpChallenges.userId,
          set: {
            codeHash: input.codeHash,
            expiresAt: input.expiresAt,
            lastSentAt: input.now,
            attempts: 0,
            consumedAt: null,
          },
        });
    },

    /**
     * Takes one of the five attempts in a single conditional UPDATE, before the
     * code is compared. PostgreSQL re-checks attempts < 5 under the row lock, so
     * parallel guesses cannot get more than five comparisons.
     */
    async reserveOtpAttempt(userId: number, now: Date) {
      const [reserved] = await db
        .update(otpChallenges)
        .set({ attempts: sql`${otpChallenges.attempts} + 1` })
        .where(
          and(
            eq(otpChallenges.userId, userId),
            isNull(otpChallenges.consumedAt),
            gt(otpChallenges.expiresAt, now),
            lt(otpChallenges.attempts, OTP_MAX_ATTEMPTS),
          ),
        )
        .returning({
          codeHash: otpChallenges.codeHash,
          attempts: otpChallenges.attempts,
        });
      return reserved ?? null;
    },

    /**
     * Consumes the challenge and verifies the account together. The
     * consumed_at IS NULL guard means two correct codes cannot both win.
     */
    async consumeChallengeAndVerify(userId: number, now: Date) {
      return db.transaction(async (tx) => {
        const [consumed] = await tx
          .update(otpChallenges)
          .set({ consumedAt: now })
          .where(
            and(
              eq(otpChallenges.userId, userId),
              isNull(otpChallenges.consumedAt),
            ),
          )
          .returning({ id: otpChallenges.id });
        if (!consumed) return false;

        await tx
          .update(users)
          .set({ emailVerifiedAt: now, updatedAt: now })
          .where(eq(users.id, userId));
        return true;
      });
    },
  };
}

export type AuthRepo = ReturnType<typeof createAuthRepo>;
