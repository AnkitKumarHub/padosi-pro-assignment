import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Db } from "./client.ts";
import { categories, tasks } from "./schema.ts";

type SeedFile = {
  categories: Array<{
    name: string;
    description: string;
    tasks: Array<{ name: string; description: string }>;
  }>;
};

export async function seedCatalogue(db: Db) {
  const path = join(process.cwd(), "padosipro_task_catalogue_seed.json");
  const data = JSON.parse(readFileSync(path, "utf8")) as SeedFile;

  for (const category of data.categories) {
    const [row] = await db
      .insert(categories)
      .values({ name: category.name, description: category.description })
      .onConflictDoUpdate({
        target: categories.name,
        set: { description: category.description },
      })
      .returning();

    const categoryId = row!.id;

    for (const task of category.tasks) {
      await db
        .insert(tasks)
        .values({
          categoryId,
          name: task.name,
          description: task.description,
        })
        .onConflictDoUpdate({
          target: [tasks.categoryId, tasks.name],
          set: { description: task.description },
        });
    }
  }

  const allTasks = await db.select({ id: tasks.id }).from(tasks);
  if (allTasks.length < 20) {
    throw new Error(`Catalogue seed expected at least 20 tasks, found ${allTasks.length}.`);
  }
}
