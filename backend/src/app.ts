import { apiReference } from "@scalar/express-api-reference";
import express, { type ErrorRequestHandler } from "express";
import type { Pool } from "pg";
import { z } from "zod";
import type { Clock } from "./lib/clock.ts";
import { ApiError } from "./lib/errors.ts";
import { requireAuth as createRequireAuth } from "./middleware/auth.ts";
import { registerAuthRoutes } from "./modules/auth/routes.ts";
import type { AuthService } from "./modules/auth/service.ts";
import { registerProfileRoutes } from "./modules/profile/routes.ts";
import type { ProfileService } from "./modules/profile/service.ts";
import { registerTasksRoutes } from "./modules/tasks/routes.ts";
import type { TasksService } from "./modules/tasks/service.ts";
import { buildOpenApiDocument, defineRoute, registry } from "./openapi.ts";

const healthSchema = registry.register(
  "Health",
  z.object({
    status: z.enum(["ok", "unavailable"]),
    database: z.enum(["ok", "unavailable"]),
  }),
);

function isJsonParseError(err: unknown): err is SyntaxError & { status: number } {
  return err instanceof SyntaxError && "status" in err && err.status === 400;
}

export function createApp(deps: {
  pool: Pool;
  auth: AuthService;
  profile: ProfileService;
  tasks: TasksService;
  jwtSecret: string;
  clock: Clock;
}) {
  const requireAuth = createRequireAuth(deps.jwtSecret, deps.clock);
  const app = express();

  app.use(express.json());

  defineRoute(
    app,
    {
      method: "get",
      path: "/api/v1/health",
      summary: "Report API and database readiness",
      responses: {
        200: {
          description: "The API and the database are reachable.",
          content: { "application/json": { schema: healthSchema } },
        },
        503: {
          description: "The database is not reachable.",
          content: { "application/json": { schema: healthSchema } },
        },
      },
    },
    async (_req, res) => {
      try {
        await deps.pool.query("select 1");
        res.status(200).json({ status: "ok", database: "ok" });
      } catch {
        res.status(503).json({ status: "unavailable", database: "unavailable" });
      }
    },
  );

  registerAuthRoutes(app, { auth: deps.auth, requireAuth });
  registerProfileRoutes(app, { profile: deps.profile, requireAuth });
  registerTasksRoutes(app, { tasks: deps.tasks, requireAuth });

  app.get("/api/v1/openapi.json", (_req, res) => {
    res.json(buildOpenApiDocument());
  });

  app.use("/api/v1/docs", apiReference({ url: "/api/v1/openapi.json" }));

  app.use((_req, _res, next) => {
    next(new ApiError(404, "NOT_FOUND", "The requested resource was not found."));
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ApiError) {
      if (err.code === "OTP_RESEND_COOLDOWN" && err.resendAvailableInSeconds) {
        res.set("Retry-After", String(err.resendAvailableInSeconds));
      }
      res.status(err.status).json({
        error: {
          code: err.code,
          message: err.message,
          ...(err.fields ? { fields: err.fields } : {}),
          ...(err.resendAvailableInSeconds !== undefined
            ? { resendAvailableInSeconds: err.resendAvailableInSeconds }
            : {}),
        },
      });
      return;
    }

    if (isJsonParseError(err)) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request body must be valid JSON.",
        },
      });
      return;
    }

    // Logged without the body, so a password or code never reaches the logs.
    console.error("Unexpected error", {
      name: err instanceof Error ? err.name : "UnknownError",
    });
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected server error occurred.",
      },
    });
  };

  app.use(errorHandler);

  return app;
}
