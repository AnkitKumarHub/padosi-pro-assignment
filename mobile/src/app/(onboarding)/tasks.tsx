import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import type { CatalogueCategory, CatalogueTask } from "@/api/tasks";
import { getTaskCatalogue, getTaskSelection } from "@/api/tasks";
import { errorMessage } from "@/api/client";
import {
  BackButton,
  EmptyState,
  ErrorBanner,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  SearchField,
  SectionHeader,
  SelectableTaskRow,
  SkeletonList,
  Subtitle,
  TextLink,
  Title,
} from "@/components/ui";
import { tasksHomeHref } from "@/lib/onboarding";
import { filterCatalogue } from "@/lib/taskSearch";
import { useUnauthorizedHandler } from "@/lib/useUnauthorized";
import { useSessionStore } from "@/store/session";
import { spacing } from "@/theme";

type Row =
  | { type: "header"; key: string; title: string; description: string }
  | { type: "task"; key: string; task: CatalogueTask };

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function buildRows(categories: CatalogueCategory[]): Row[] {
  const rows: Row[] = [];
  for (const category of categories) {
    rows.push({
      type: "header",
      key: `cat-${category.id}`,
      title: category.name,
      description: category.description,
    });
    for (const task of category.tasks) {
      rows.push({ type: "task", key: `task-${task.id}`, task });
    }
  }
  return rows;
}

export default function TaskSelectionScreen() {
  const params = useLocalSearchParams<{ fromHome?: string; categoryId?: string; q?: string }>();
  const fromHome = firstParam(params.fromHome) === "1";
  const categoryIdRaw = Number(firstParam(params.categoryId));
  const categoryId = Number.isInteger(categoryIdRaw) && categoryIdRaw > 0 ? categoryIdRaw : undefined;
  const step = useSessionStore((state) => state.user?.onboardingStep);
  const handleUnauthorized = useUnauthorizedHandler();

  const [categories, setCategories] = useState<CatalogueCategory[]>([]);
  const [search, setSearch] = useState(firstParam(params.q));
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const catalogue = await getTaskCatalogue();
      setCategories(catalogue.categories);
      // Saving replaces the whole selection. Keep already saved ids so a category filter cannot drop them.
      if (fromHome) {
        const selection = await getTaskSelection();
        setSelectedIds(new Set(selection.tasks.map((task) => task.id)));
      }
    } catch (err) {
      if (await handleUnauthorized(err)) return;
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [fromHome, handleUnauthorized]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => filterCatalogue(categories, search, categoryId),
    [categories, search, categoryId],
  );
  const rows = useMemo(() => buildRows(filtered), [filtered]);
  const selectedCount = selectedIds.size;

  if (step === "PROFILE") return <Redirect href="/profile" />;
  if (step === "COMPLETE" && !fromHome) return <Redirect href={tasksHomeHref} />;

  function toggleTask(id: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onContinue() {
    const ids = [...selectedIds].sort((a, b) => a - b);
    router.push({
      pathname: "/confirm",
      params: { taskIds: ids.join(","), fromHome: fromHome ? "1" : "0" },
    });
  }

  const query = search.trim();

  return (
    <PageShell
      header={
        <>
          {fromHome ? <BackButton label="Back" onPress={() => router.back()} /> : null}
          <Title>Choose your tasks</Title>
          {fromHome ? <Subtitle>Updating the tasks on your Tasks tab.</Subtitle> : null}
          <SearchField
            label="Search"
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or description"
          />
          {error ? <ErrorBanner message={error} /> : null}
        </>
      }
      footer={
        <View style={styles.footer}>
          <Subtitle>
            {selectedCount} selected
          </Subtitle>
          <PrimaryButton
            label="Continue"
            onPress={onContinue}
            disabled={loading || error !== null}
          />
          {error ? <SecondaryButton label="Try again" onPress={() => void load()} /> : null}
        </View>
      }
    >
      {loading ? (
        <SkeletonList />
      ) : error ? null : rows.length === 0 ? (
        <EmptyState
          title={query.length > 0 ? `No tasks match "${query}"` : "No tasks in this category"}
          body={query.length > 0 ? "Try another word." : "Pick another category from home."}
          action={
            query.length > 0 ? <TextLink label="Clear search" onPress={() => setSearch("")} /> : null
          }
        />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.key}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            if (item.type === "header") {
              return <SectionHeader title={item.title} description={item.description} />;
            }
            const task = item.task;
            return (
              <SelectableTaskRow
                name={task.name}
                description={task.description}
                selected={selectedIds.has(task.id)}
                onToggle={() => toggleTask(task.id)}
              />
            );
          }}
        />
      )}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: spacing.sm,
  },
});
