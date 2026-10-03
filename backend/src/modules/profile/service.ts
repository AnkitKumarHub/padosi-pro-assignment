import type { ProfileRepo } from "./repo.ts";

function toResponse(profile: {
  name: string;
  mobileNumber: string;
  address: string;
  businessName: string | null;
}) {
  return {
    name: profile.name,
    mobileNumber: profile.mobileNumber,
    address: profile.address,
    businessName: profile.businessName,
  };
}

export function createProfileService(repo: ProfileRepo) {
  return {
    async get(userId: number) {
      const profile = await repo.findByUserId(userId);
      return { profile: profile ? toResponse(profile) : null };
    },

    async save(
      userId: number,
      input: {
        name: string;
        mobileNumber: string;
        address: string;
        businessName: string | null;
      },
    ) {
      const profile = await repo.upsert(userId, input);
      return { profile: toResponse(profile) };
    },
  };
}

export type ProfileService = ReturnType<typeof createProfileService>;
