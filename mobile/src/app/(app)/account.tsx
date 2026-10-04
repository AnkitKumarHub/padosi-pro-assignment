import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { getProfile, type Profile } from "@/api/profile";
import { errorMessage } from "@/api/client";
import {
  DangerButton,
  EmptyState,
  ErrorBanner,
  Heading,
  PageShell,
  PrimaryButton,
  SkeletonList,
  Subtitle,
  Title,
} from "@/components/ui";
import { useUnauthorizedHandler } from "@/lib/useUnauthorized";
import { useSessionStore } from "@/store/session";
import { colors, radius, spacing, type } from "@/theme";

export default function ProfileInfoScreen() {
  const email = useSessionStore((state) => state.user?.email);
  const signOut = useSessionStore((state) => state.signOut);
  const handleUnauthorized = useUnauthorizedHandler();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProfile();
      setProfile(response.profile);
    } catch (err) {
      if (await handleUnauthorized(err)) return;
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayEmail = email && email.length > 0 ? email : "Not available";

  return (
    <PageShell
      bottomInset={false}
      header={
        <>
          <Title>{profile?.name ?? "Profile"}</Title>
          {profile ? <Subtitle>{displayEmail}</Subtitle> : null}
        </>
      }
      footer={
        loading ? null : <DangerButton label="Log out" onPress={() => void signOut()} />
      }
    >
      {loading ? (
        <SkeletonList rows={4} />
      ) : error ? (
        <View style={styles.section}>
          <ErrorBanner message={error} />
          <PrimaryButton label="Try again" onPress={() => void load()} />
        </View>
      ) : !profile ? (
        <EmptyState
          title="Profile is not available"
          body="Your saved details could not be loaded."
          action={<PrimaryButton label="Try again" onPress={() => void load()} />}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Heading>Account</Heading>
          <Detail label="Mobile" value={profile.mobileNumber} />
          <Detail label="Address" value={profile.address} />
          <Detail label="Business name" value={profile.businessName ?? "Not provided"} />
          <Detail label="Email" value={displayEmail} />
        </ScrollView>
      )}
    </PageShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  detail: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceRaised,
  },
  detailLabel: {
    ...type.small,
    color: colors.textSecondary,
  },
  detailValue: {
    ...type.body,
    color: colors.textPrimary,
  },
});
