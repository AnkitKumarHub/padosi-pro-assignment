export type OnboardingStep = "PROFILE" | "TASK_SELECTION" | "COMPLETE";

export function onboardingStep(state: {
  hasProfile: boolean;
  taskSelectionCompletedAt: Date | null;
}): OnboardingStep {
  if (!state.hasProfile) return "PROFILE";
  if (!state.taskSelectionCompletedAt) return "TASK_SELECTION";
  return "COMPLETE";
}
