import type { Clock } from "../../lib/clock.ts";
import { ApiError } from "../../lib/errors.ts";
import type { TasksRepo } from "./repo.ts";

export function createTasksService(deps: { repo: TasksRepo; clock: Clock }) {
  const { repo, clock } = deps;

  return {
    listCatalogue() {
      return repo.listCatalogue().then((categories) => ({ categories }));
    },

    getSelection(userId: number) {
      return repo.getSelection(userId);
    },

    async replaceSelection(userId: number, taskIds: number[]) {
      const result = await repo.replaceSelection(userId, taskIds, clock.now());
      if (!result.ok) {
        if (result.reason === "PROFILE_INCOMPLETE") {
          throw new ApiError(
            409,
            "PROFILE_INCOMPLETE",
            "Complete your profile before choosing tasks.",
          );
        }
        throw new ApiError(
          400,
          "INVALID_TASK_SELECTION",
          "One or more task IDs do not exist.",
        );
      }
      return {
        selectionCompleted: result.selectionCompleted,
        tasks: result.tasks,
      };
    },
  };
}

export type TasksService = ReturnType<typeof createTasksService>;
