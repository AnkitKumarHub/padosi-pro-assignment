import { Redirect, Stack } from "expo-router";
import { useSessionStore } from "@/store/session";
import { colors } from "@/theme";

export default function OnboardingLayout() {
  const status = useSessionStore((state) => state.status);

  if (status === "unauthenticated") return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
    />
  );
}
