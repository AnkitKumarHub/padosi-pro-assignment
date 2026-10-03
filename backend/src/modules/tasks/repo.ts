import { asc, eq, inArray } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import {
  categories,
  profiles,
  tasks,
  userTasks,
  users,
} from "../../db/schema.ts";

export function createTasksRepo(db: Db) {
  return {
    async hasProfile(userId: number) {
      const [row] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(eq(profiles.userId, userId));
      return row !== undefined;
    },

    async listCatalogue() {
      const rows = await db
        .select({
          categoryId: categories.id,
          categoryName: categories.name,
          categoryDescription: categories.description,
          taskId: tasks.id,
          taskName: tasks.name,
          taskDescription: tasks.description,
        })
        .from(categories)
        .innerJoin(tasks, eq(tasks.categoryId, categories.id))
        .orderBy(asc(categories.id), asc(tasks.id));

      const grouped = new Map<
        number,
        {
          id: number;
          name: string;
          description: string;
          tasks: Array<{ id: number; name: string; description: string }>;
        }
      >();

      for (const row of rows) {
        let category = grouped.get(row.categoryId);
        if (!category) {
          category = {
            id: row.categoryId,
            name: row.categoryName,
            description: row.categoryDescription,
            tasks: [],
          };
          grouped.set(row.categoryId, category);
        }
        category.tasks.push({
          id: row.taskId,
          name: row.taskName,
          description: row.taskDescription,
        });
      }

      return [...grouped.values()];
    },

    async getSelection(userId: number) {
      const [user] = await db
        .select({ taskSelectionCompletedAt: users.taskSelectionCompletedAt })
        .from(users)
        .where(eq(users.id, userId));
      const completed = user?.taskSelectionCompletedAt != null;

      const selected = await db
        .select({
          id: tasks.id,
          name: tasks.name,
          description: tasks.description,
          categoryName: categories.name,
        })
        .from(userTasks)
        .innerJoin(tasks, eq(userTasks.taskId, tasks.id))
        .innerJoin(categories, eq(tasks.categoryId, categories.id))
        .where(eq(userTasks.userId, userId))
        .orderBy(asc(tasks.id));

      return {
        selectionCompleted: completed,
        tasks: selected.map((task) => ({
          id: task.id,
          name: task.name,
          description: task.description,
          category: task.categoryName,
        })),
      };
    },

    async replaceSelection(userId: number, taskIds: number[], now: Date) {
      return db.transaction(async (tx) => {
        const hasProfile = await tx
          .select({ userId: profiles.userId })
          .from(profiles)
          .where(eq(profiles.userId, userId));
        if (hasProfile.length === 0) {
          return { ok: false as const, reason: "PROFILE_INCOMPLETE" as const };
        }

        if (taskIds.length > 0) {
          const existing = await tx
            .select({ id: tasks.id })
            .from(tasks)
            .where(inArray(tasks.id, taskIds));
          if (existing.length !== taskIds.length) {
            return { ok: false as const, reason: "INVALID_TASK_SELECTION" as const };
          }
        }

        await tx.delete(userTasks).where(eq(userTasks.userId, userId));
        if (taskIds.length > 0) {
          await tx.insert(userTasks).values(
            taskIds.map((taskId) => ({ userId, taskId })),
          );
        }
        await tx
          .update(users)
          .set({ taskSelectionCompletedAt: now, updatedAt: now })
          .where(eq(users.id, userId));

        const selected = await tx
          .select({
            id: tasks.id,
            name: tasks.name,
            description: tasks.description,
            categoryName: categories.name,
          })
          .from(userTasks)
          .innerJoin(tasks, eq(userTasks.taskId, tasks.id))
          .innerJoin(categories, eq(tasks.categoryId, categories.id))
          .where(eq(userTasks.userId, userId))
          .orderBy(asc(tasks.id));

        return {
          ok: true as const,
          selectionCompleted: true,
          tasks: selected.map((task) => ({
            id: task.id,
            name: task.name,
            description: task.description,
            category: task.categoryName,
          })),
        };
      });
    },
  };
}

export type TasksRepo = ReturnType<typeof createTasksRepo>;
