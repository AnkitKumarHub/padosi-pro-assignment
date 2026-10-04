import { Redirect, Stack } from "expo-router";
import { hrefForOnboardingStep } from "@/lib/onboarding";
import { useSessionStore } from "@/store/session";
import { colors } from "@/theme";

export default function AuthLayout() {
  const status = useSessionStore((state) => state.status);

  const user = useSessionStore((state) => state.user);
  if (status === "authenticated" && user) {
    return <Redirect href={hrefForOnboardingStep(user.onboardingStep)} />;
  }

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
    />
  );
}
