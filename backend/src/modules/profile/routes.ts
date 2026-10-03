import type { Express, RequestHandler } from "express";
import { z } from "zod";
import { defineRoute, errorSchema, registry } from "../../openapi.ts";
import { profileBody } from "./schema.ts";
import type { ProfileService } from "./service.ts";

const profile = registry.register(
  "Profile",
  z.object({
    name: z.string(),
    mobileNumber: z.string(),
    address: z.string(),
    businessName: z.string().nullable(),
  }),
);

const profileResponse = registry.register(
  "ProfileResponse",
  z.object({ profile: profile.nullable() }),
);

const json = (schema: z.ZodType, description: string) => ({
  description,
  content: { "application/json": { schema } },
});

const failure = (description: string) => json(errorSchema, description);

export function registerProfileRoutes(
  app: Express,
  deps: { profile: ProfileService; requireAuth: RequestHandler },
) {
  defineRoute(
    app,
    {
      method: "get",
      path: "/api/v1/profile",
      summary: "Return the signed-in user's profile",
      tags: ["Profile"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: json(profileResponse, "Profile or null before onboarding saves one."),
        401: failure("The token is missing, expired or invalid."),
      },
    },
    [deps.requireAuth, async (req, res) => {
      res.json(await deps.profile.get(req.userId!));
    }],
  );

  defineRoute(
    app,
    {
      method: "put",
      path: "/api/v1/profile",
      summary: "Create or replace the signed-in user's profile",
      tags: ["Profile"],
      security: [{ bearerAuth: [] }],
      body: profileBody,
      responses: {
        200: json(profileResponse, "Saved profile."),
        400: failure("One or more fields are invalid."),
        401: failure("The token is missing, expired or invalid."),
      },
    },
    [deps.requireAuth, async (req, res) => {
      res.json(await deps.profile.save(req.userId!, req.body));
    }],
  );
}
