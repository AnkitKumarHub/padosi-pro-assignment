import { authedRequest } from "./authenticated";

export type Profile = {
  name: string;
  mobileNumber: string;
  address: string;
  businessName: string | null;
};

export type ProfileResponse = {
  profile: Profile | null;
};

export type ProfileInput = {
  name: string;
  mobileNumber: string;
  address: string;
  businessName?: string;
};

export function getProfile() {
  return authedRequest<ProfileResponse>("/profile");
}

export function saveProfile(input: ProfileInput) {
  return authedRequest<ProfileResponse>("/profile", { method: "PUT", body: input });
}
