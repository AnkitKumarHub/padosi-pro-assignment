import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { hrefForOnboardingStep } from "@/lib/onboarding";
import { useSessionStore } from "@/store/session";
import { colors } from "@/theme";

// Tasks is the screen that opens. Trigger order is left to right: Browse, Tasks, Profile.
export const unstable_settings = {
  anchor: "home",
};

export default function AppLayout() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

  if (status === "unauthenticated") return <Redirect href="/login" />;
  if (status === "authenticated" && user && user.onboardingStep !== "COMPLETE") {
    return <Redirect href={hrefForOnboardingStep(user.onboardingStep)} />;
  }

  return (
    <NativeTabs
      backgroundColor={colors.surface}
      tintColor={colors.textPrimary}
      indicatorColor={colors.accentSoft}
      iconColor={{ default: colors.textSecondary, selected: colors.textPrimary }}
      labelStyle={{
        default: { color: colors.textSecondary },
        selected: { color: colors.textPrimary },
      }}
      blurEffect="none"
    >
      <NativeTabs.Trigger name="browse">
        <NativeTabs.Trigger.Icon
          sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }}
          md="grid_view"
        />
        <NativeTabs.Trigger.Label>Browse</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon
          sf={{ default: "checklist", selected: "checklist.checked" }}
          md="task_alt"
        />
        <NativeTabs.Trigger.Label>Tasks</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} md="person" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
