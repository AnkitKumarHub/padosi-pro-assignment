import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { getTaskCatalogue, saveTaskSelection } from "@/api/tasks";
import { errorMessage } from "@/api/client";
import {
  BackButton,
  ErrorBanner,
  PrimaryButton,
  Screen,
  SkeletonList,
  Subtitle,
  TaskListRow,
  Title,
} from "@/components/ui";
import { tasksHomeHref } from "@/lib/onboarding";
import { parseTaskIdParams } from "@/lib/validation";
import { useUnauthorizedHandler } from "@/lib/useUnauthorized";
import { useSessionStore } from "@/store/session";

export default function ConfirmTasksScreen() {
  const params = useLocalSearchParams<{ taskIds?: string; fromHome?: string }>();
  const taskIds = useMemo(() => parseTaskIdParams(params.taskIds), [params.taskIds]);
  const fromHome = params.fromHome === "1";
  const step = useSessionStore((state) => state.user?.onboardingStep);
  const refreshSession = useSessionStore((state) => state.refreshSession);
  const handleUnauthorized = useUnauthorizedHandler();

  const [labels, setLabels] = useState<{ id: number; name: string; category: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const catalogue = await getTaskCatalogue();
        const byId = new Map<number, { name: string; category: string }>();
        for (const category of catalogue.categories) {
          for (const task of category.tasks) {
            byId.set(task.id, { name: task.name, category: category.name });
          }
        }
        setLabels(
          taskIds
            .map((id) => {
              const meta = byId.get(id);
              return meta ? { id, name: meta.name, category: meta.category } : null;
            })
            .filter((row): row is { id: number; name: string; category: string } => row !== null),
        );
      } catch (error) {
        if (await handleUnauthorized(error)) return;
        setFormError(errorMessage(error));
      } finally {
        setLoading(false);
      }
    })();
  }, [handleUnauthorized, taskIds]);

  if (step === "PROFILE") return <Redirect href="/profile" />;
  if (step === "COMPLETE" && !fromHome) return <Redirect href={tasksHomeHref} />;

  async function onSave() {
    setFormError(null);
    setSubmitting(true);
    try {
      await saveTaskSelection(taskIds);
      await refreshSession();
      router.replace(tasksHomeHref);
    } catch (error) {
      if (await handleUnauthorized(error)) return;
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <Title>Review your tasks</Title>
        <SkeletonList rows={4} />
      </Screen>
    );
  }

  const zeroTasks = taskIds.length === 0;

  return (
    <Screen>
      <BackButton label="Tasks" onPress={() => router.back()} />
      <Title>Review your tasks</Title>

      {formError ? <ErrorBanner message={formError} /> : null}

      {zeroTasks ? (
        <Subtitle>
          You have not selected any tasks. You can still continue; Tasks will let you choose
          tasks later.
        </Subtitle>
      ) : (
        labels.map((task) => (
          <TaskListRow key={task.id} name={task.name} meta={task.category} />
        ))
      )}

      <PrimaryButton
        label={zeroTasks ? "Save and go to Tasks" : "Save tasks"}
        onPress={() => void onSave()}
        loading={submitting}
      />
    </Screen>
  );
}
