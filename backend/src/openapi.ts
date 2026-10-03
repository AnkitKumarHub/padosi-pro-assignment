import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  type RouteConfig,
} from "@asteasolutions/zod-to-openapi";
import type { Express, RequestHandler } from "express";
import { z, type ZodObject } from "zod";
import { ApiError } from "./lib/errors.ts";

// Adds the .openapi() metadata the registry needs; must run before any register call.
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export const errorSchema = registry.register(
  "Error",
  z.object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      fields: z.record(z.string(), z.array(z.string())).optional(),
      resendAvailableInSeconds: z.number().optional(),
    }),
  }),
);

type RouteDefinition = Pick<
  RouteConfig,
  "summary" | "description" | "tags" | "security" | "responses"
> & {
  method: "get" | "post" | "put";
  path: string;
  body?: ZodObject;
};

function validateBody(schema: ZodObject): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const fields: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "body";
        (fields[key] ??= []).push(issue.message);
      }
      next(
        new ApiError(400, "VALIDATION_ERROR", "One or more fields are invalid.", {
          fields,
        }),
      );
      return;
    }
    req.body = parsed.data;
    next();
  };
}

/** Mounts the Express route and documents it from the same definition. */
export function defineRoute(
  app: Express,
  route: RouteDefinition,
  handler: RequestHandler | RequestHandler[],
) {
  const { body, ...config } = route;

  registry.registerPath({
    ...config,
    request: body
      ? { body: { required: true, content: { "application/json": { schema: body } } } }
      : undefined,
  });

  const handlers = Array.isArray(handler) ? handler : [handler];
  app[route.method](
    route.path,
    ...(body ? [validateBody(body), ...handlers] : handlers),
  );
}

export function buildOpenApiDocument() {
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: "3.0.0",
    info: {
      title: "PadosiPro API",
      version: "1.0.0",
    },
  });
}
