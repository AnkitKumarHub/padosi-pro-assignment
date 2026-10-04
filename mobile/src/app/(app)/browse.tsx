import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import type { CatalogueCategory } from "@/api/tasks";
import { getTaskCatalogue } from "@/api/tasks";
import { errorMessage } from "@/api/client";
import {
  CategoryBlock,
  EmptyState,
  ErrorBanner,
  Heading,
  PageShell,
  PrimaryButton,
  SearchField,
  SkeletonList,
  Title,
} from "@/components/ui";
import { useUnauthorizedHandler } from "@/lib/useUnauthorized";
import { spacing } from "@/theme";

export default function BrowseScreen() {
  const handleUnauthorized = useUnauthorizedHandler();
  const [categories, setCategories] = useState<CatalogueCategory[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const catalogue = await getTaskCatalogue();
      setCategories(catalogue.categories);
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

  function openTasks(extra?: { q?: string; categoryId?: string }) {
    router.push({
      pathname: "/tasks",
      params: { fromHome: "1", ...extra },
    });
  }

  return (
    <PageShell bottomInset={false} header={<Title>Browse</Title>}>
      {loading ? (
        <SkeletonList rows={4} />
      ) : error ? (
        <View style={styles.section}>
          <ErrorBanner message={error} />
          <PrimaryButton label="Try again" onPress={() => void load()} />
        </View>
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          body="The catalogue is empty."
          action={<PrimaryButton label="Try again" onPress={() => void load()} />}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <SearchField
            label="Search"
            value={query}
            onChangeText={setQuery}
            placeholder="Search for a task or service"
            onSubmit={() => openTasks(query.trim() ? { q: query.trim() } : undefined)}
          />
          <Heading>Browse by category</Heading>
          {categories.map((category) => (
            <CategoryBlock
              key={category.id}
              name={category.name}
              description={category.description}
              onPress={() => openTasks({ categoryId: String(category.id) })}
            />
          ))}
        </ScrollView>
      )}
    </PageShell>
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
});
