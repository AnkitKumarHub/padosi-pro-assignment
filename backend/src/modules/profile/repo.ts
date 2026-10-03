import { eq } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { profiles } from "../../db/schema.ts";

export function createProfileRepo(db: Db) {
  return {
    async findByUserId(userId: number) {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, userId));
      return profile ?? null;
    },

    async upsert(
      userId: number,
      input: {
        name: string;
        mobileNumber: string;
        address: string;
        businessName: string | null;
      },
    ) {
      const now = new Date();
      const [profile] = await db
        .insert(profiles)
        .values({
          userId,
          name: input.name,
          mobileNumber: input.mobileNumber,
          address: input.address,
          businessName: input.businessName,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: profiles.userId,
          set: {
            name: input.name,
            mobileNumber: input.mobileNumber,
            address: input.address,
            businessName: input.businessName,
            updatedAt: now,
          },
        })
        .returning();
      return profile!;
    },
  };
}

export type ProfileRepo = ReturnType<typeof createProfileRepo>;
