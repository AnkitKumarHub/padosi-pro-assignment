import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { getProfile } from "@/api/profile";
import type { SelectedTask } from "@/api/tasks";
import { getTaskSelection } from "@/api/tasks";
import { errorMessage } from "@/api/client";
import {
  BrandMark,
  EmptyState,
  ErrorBanner,
  Heading,
  PageShell,
  PrimaryButton,
  SkeletonList,
  TaskListRow,
  Title,
} from "@/components/ui";
import { useUnauthorizedHandler } from "@/lib/useUnauthorized";
import { useSessionStore } from "@/store/session";
import { spacing } from "@/theme";

function greetingFor(name: string) {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${part}, ${name}`;
}

function displayName(name: string, email: string | undefined) {
  const trimmed = name.trim();
  if (trimmed.length > 0) return trimmed.split(/\s+/)[0] ?? trimmed;
  const local = email?.split("@")[0]?.trim();
  return local && local.length > 0 ? local : "there";
}

export default function TasksScreen() {
  const email = useSessionStore((state) => state.user?.email);
  const handleUnauthorized = useUnauthorizedHandler();

  const [profileName, setProfileName] = useState("");
  const [tasks, setTasks] = useState<SelectedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileResponse, selection] = await Promise.all([getProfile(), getTaskSelection()]);
      setProfileName(profileResponse.profile?.name ?? "");
      setTasks(selection.tasks);
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

  return (
    <PageShell
      bottomInset={false}
      header={
        <View style={styles.headerBlock}>
          <BrandMark />
          <Title>{greetingFor(displayName(profileName, email))}</Title>
        </View>
      }
    >
      {loading ? (
        <SkeletonList rows={4} />
      ) : error ? (
        <View style={styles.section}>
          <ErrorBanner message={error} />
          <PrimaryButton label="Try again" onPress={() => void load()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Heading>Your tasks</Heading>
          {tasks.length === 0 ? (
            <EmptyState
              title="No tasks selected yet"
              body="Choose tasks to get started."
              action={
                <PrimaryButton
                  label="Choose tasks"
                  onPress={() => router.push({ pathname: "/tasks", params: { fromHome: "1" } })}
                />
              }
            />
          ) : (
            tasks.map((task) => (
              <TaskListRow
                key={task.id}
                name={task.name}
                meta={task.category}
                description={task.description}
              />
            ))
          )}
        </ScrollView>
      )}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: spacing.sm,
  },
  scroll: {
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
});
