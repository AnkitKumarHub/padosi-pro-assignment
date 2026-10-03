import type { Express, RequestHandler } from "express";
import { z } from "zod";
import { defineRoute, errorSchema, registry } from "../../openapi.ts";
import { taskSelectionBody } from "./schema.ts";
import type { TasksService } from "./service.ts";

const catalogueTask = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
});

const catalogueCategory = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  tasks: z.array(catalogueTask),
});

const catalogueResponse = registry.register(
  "TaskCatalogue",
  z.object({ categories: z.array(catalogueCategory) }),
);

const selectedTask = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
});

const taskSelectionResponse = registry.register(
  "TaskSelection",
  z.object({
    selectionCompleted: z.boolean(),
    tasks: z.array(selectedTask),
  }),
);

const json = (schema: z.ZodType, description: string) => ({
  description,
  content: { "application/json": { schema } },
});

const failure = (description: string) => json(errorSchema, description);

export function registerTasksRoutes(
  app: Express,
  deps: { tasks: TasksService; requireAuth: RequestHandler },
) {
  defineRoute(
    app,
    {
      method: "get",
      path: "/api/v1/tasks",
      summary: "Return the seeded task catalogue grouped by category",
      tags: ["Tasks"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: json(catalogueResponse, "Catalogue grouped by category."),
        401: failure("The token is missing, expired or invalid."),
      },
    },
    [deps.requireAuth, async (_req, res) => {
      res.json(await deps.tasks.listCatalogue());
    }],
  );

  defineRoute(
    app,
    {
      method: "get",
      path: "/api/v1/task-selection",
      summary: "Return the signed-in user's saved task selection",
      tags: ["Tasks"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: json(taskSelectionResponse, "Selection state and chosen tasks."),
        401: failure("The token is missing, expired or invalid."),
      },
    },
    [deps.requireAuth, async (req, res) => {
      res.json(await deps.tasks.getSelection(req.userId!));
    }],
  );

  defineRoute(
    app,
    {
      method: "put",
      path: "/api/v1/task-selection",
      summary: "Replace the signed-in user's task selection",
      tags: ["Tasks"],
      security: [{ bearerAuth: [] }],
      body: taskSelectionBody,
      responses: {
        200: json(taskSelectionResponse, "Saved selection."),
        400: failure("Invalid task IDs or request body."),
        401: failure("The token is missing, expired or invalid."),
        409: failure("Profile onboarding is not complete."),
      },
    },
    [deps.requireAuth, async (req, res) => {
      res.json(await deps.tasks.replaceSelection(req.userId!, req.body.taskIds));
    }],
  );
}
