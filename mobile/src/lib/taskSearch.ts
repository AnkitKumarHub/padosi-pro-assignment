import type { CatalogueCategory } from "@/api/tasks";

/** Client-side search over the catalogue (SPEC F-039). */
export function filterCatalogue(
  categories: CatalogueCategory[],
  query: string,
  categoryId?: number,
): CatalogueCategory[] {
  const scoped =
    categoryId === undefined
      ? categories
      : categories.filter((category) => category.id === categoryId);
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return scoped;

  return scoped
    .map((category) => ({
      ...category,
      tasks: category.tasks.filter(
        (task) =>
          task.name.toLowerCase().includes(needle) ||
          task.description.toLowerCase().includes(needle),
      ),
    }))
    .filter((category) => category.tasks.length > 0);
}
