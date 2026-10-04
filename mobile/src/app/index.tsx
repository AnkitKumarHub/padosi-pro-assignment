import { Redirect, router } from "expo-router";
import { ActivityIndicator } from "react-native";
import { CenteredState, Display, ErrorBanner, PrimaryButton, Subtitle, TextLink } from "@/components/ui";
import { colors } from "@/theme";
import { hrefForOnboardingStep } from "@/lib/onboarding";
import { useSessionStore } from "@/store/session";

export default function Bootstrap() {
  const status = useSessionStore((state) => state.status);
  const error = useSessionStore((state) => state.error);
  const restore = useSessionStore((state) => state.restore);

  const user = useSessionStore((state) => state.user);
  if (status === "authenticated" && user) {
    return <Redirect href={hrefForOnboardingStep(user.onboardingStep)} />;
  }
  if (status === "unauthenticated") return <Redirect href="/login" />;

  // A network or server failure keeps the stored token and offers a retry,
  // so an offline user is not signed out (DESIGN section 4).
  if (status === "error") {
    return (
      <CenteredState>
        <ErrorBanner message={error ?? "Could not reach the server."} />
        <PrimaryButton label="Try again" onPress={() => void restore()} />
        <TextLink muted label="Server URL" onPress={() => router.push("/server-settings")} />
      </CenteredState>
    );
  }

  return (
    <CenteredState>
      <Display>PadosiPro</Display>
      <ActivityIndicator size="large" color={colors.success} />
      <Subtitle>Loading…</Subtitle>
    </CenteredState>
  );
}
