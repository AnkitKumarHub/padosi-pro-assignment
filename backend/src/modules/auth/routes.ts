import type { Express, RequestHandler } from "express";
import { z } from "zod";
import { defineRoute, errorSchema, registry } from "../../openapi.ts";
import { loginBody, registerBody, resendOtpBody, verifyEmailBody } from "./schema.ts";
import type { AuthService } from "./service.ts";

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

const pendingVerification = registry.register(
  "PendingVerification",
  z.object({ email: z.string(), resendAvailableInSeconds: z.number() }),
);

const verifiedEmail = registry.register(
  "VerifiedEmail",
  z.object({ email: z.string(), emailVerified: z.boolean() }),
);

const onboardingStep = z.enum(["PROFILE", "TASK_SELECTION", "COMPLETE"]);

const session = registry.register(
  "Session",
  z.object({
    token: z.string(),
    user: z.object({ id: z.number(), email: z.string() }),
    onboardingStep,
  }),
);

const currentUser = registry.register(
  "CurrentUser",
  z.object({
    id: z.number(),
    email: z.string(),
    emailVerified: z.boolean(),
    onboardingStep,
  }),
);

const json = (schema: z.ZodType, description: string) => ({
  description,
  content: { "application/json": { schema } },
});

const failure = (description: string) => json(errorSchema, description);

export function registerAuthRoutes(
  app: Express,
  deps: { auth: AuthService; requireAuth: RequestHandler },
) {
  defineRoute(
    app,
    {
      method: "post",
      path: "/api/v1/auth/register",
      summary: "Create an unverified account and email its first code",
      tags: ["Auth"],
      body: registerBody,
      responses: {
        201: json(pendingVerification, "Account created; a code was emailed."),
        400: failure("The request body is invalid."),
        409: failure("The email is already registered."),
      },
    },
    async (req, res) => {
      res.status(201).json(await deps.auth.register(req.body.email, req.body.password));
    },
  );

  defineRoute(
    app,
    {
      method: "post",
      path: "/api/v1/auth/verify-email",
      summary: "Verify an account with its active code",
      tags: ["Auth"],
      body: verifyEmailBody,
      responses: {
        200: json(verifiedEmail, "The account is verified."),
        400: failure("The code is wrong, expired or missing."),
        409: failure("The email is already verified."),
        429: failure("The attempt limit for this code is used up."),
      },
    },
    async (req, res) => {
      res.json(await deps.auth.verifyEmail(req.body.email, req.body.code));
    },
  );

  defineRoute(
    app,
    {
      method: "post",
      path: "/api/v1/auth/resend-otp",
      summary: "Replace the active code once the cooldown has passed",
      tags: ["Auth"],
      body: resendOtpBody,
      responses: {
        200: json(pendingVerification, "A new code was emailed."),
        400: failure("No account exists for this email."),
        409: failure("The email is already verified."),
        429: failure("The resend cooldown has not elapsed."),
      },
    },
    async (req, res) => {
      res.json(await deps.auth.resendOtp(req.body.email));
    },
  );

  defineRoute(
    app,
    {
      method: "post",
      path: "/api/v1/auth/login",
      summary: "Authenticate a verified user and issue a token",
      tags: ["Auth"],
      body: loginBody,
      responses: {
        200: json(session, "Authenticated."),
        401: failure("The credentials are invalid."),
        403: failure("The email is not verified yet."),
      },
    },
    async (req, res) => {
      res.json(await deps.auth.login(req.body.email, req.body.password));
    },
  );

  defineRoute(
    app,
    {
      method: "get",
      path: "/api/v1/auth/me",
      summary: "Return the signed-in user",
      tags: ["Auth"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: json(currentUser, "The signed-in user."),
        401: failure("The token is missing, expired or invalid."),
      },
    },
    [deps.requireAuth, async (req, res) => {
      res.json(await deps.auth.currentUser(req.userId!));
    }],
  );
}
