import type { RequestHandler } from "express";
import type { Clock } from "../lib/clock.ts";
import { ApiError } from "../lib/errors.ts";
import { verifyToken } from "../lib/jwt.ts";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

/** Identity comes from the verified token only, never from the request body. */
export function requireAuth(jwtSecret: string, clock: Clock): RequestHandler {
  return (req, _res, next) => {
    const header = req.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const userId = token ? verifyToken(token, jwtSecret, clock.now()) : null;

    if (userId === null) {
      next(new ApiError(401, "UNAUTHORIZED", "Your session has expired."));
      return;
    }

    req.userId = userId;
    next();
  };
}
