import type { Href } from "expo-router";
import type { OnboardingStep } from "@/api/auth";

/** Tasks tab after onboarding. /home is its own path so it does not collide with the startup screen at /. */
export const tasksHomeHref = "/home" as const satisfies Href;

/** Server-driven next screen after login or cold start (SPEC F-048). */
export function hrefForOnboardingStep(step: OnboardingStep): Href {
  if (step === "PROFILE") return "/profile";
  if (step === "TASK_SELECTION") return "/tasks";
  return tasksHomeHref;
}
