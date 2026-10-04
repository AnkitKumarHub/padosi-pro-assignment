import { authedRequest } from "./authenticated";

export type CatalogueTask = {
  id: number;
  name: string;
  description: string;
};

export type CatalogueCategory = {
  id: number;
  name: string;
  description: string;
  tasks: CatalogueTask[];
};

export type TaskCatalogue = {
  categories: CatalogueCategory[];
};

export type SelectedTask = {
  id: number;
  name: string;
  description: string;
  category: string;
};

export type TaskSelection = {
  selectionCompleted: boolean;
  tasks: SelectedTask[];
};

export function getTaskCatalogue() {
  return authedRequest<TaskCatalogue>("/tasks");
}

export function getTaskSelection() {
  return authedRequest<TaskSelection>("/task-selection");
}

export function saveTaskSelection(taskIds: number[]) {
  return authedRequest<TaskSelection>("/task-selection", {
    method: "PUT",
    body: { taskIds },
  });
}
