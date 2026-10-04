import { request } from "./client";

export type OnboardingStep = "PROFILE" | "TASK_SELECTION" | "COMPLETE";

export type PendingVerification = {
  email: string;
  resendAvailableInSeconds: number;
};

export type VerifiedEmail = {
  email: string;
  emailVerified: boolean;
};

export type Session = {
  token: string;
  user: { id: number; email: string };
  onboardingStep: OnboardingStep;
};

export type CurrentUser = {
  id: number;
  email: string;
  emailVerified: boolean;
  onboardingStep: OnboardingStep;
};

export function register(email: string, password: string) {
  return request<PendingVerification>("/auth/register", {
    method: "POST",
    body: { email, password },
  });
}

export function verifyEmail(email: string, code: string) {
  return request<VerifiedEmail>("/auth/verify-email", {
    method: "POST",
    body: { email, code },
  });
}

export function resendOtp(email: string) {
  return request<PendingVerification>("/auth/resend-otp", {
    method: "POST",
    body: { email },
  });
}

export function login(email: string, password: string) {
  return request<Session>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function currentUser(token: string) {
  return request<CurrentUser>("/auth/me", { token });
}
