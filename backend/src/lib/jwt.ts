import jwt from "jsonwebtoken";

export const JWT_EXPIRES_IN = "7d";

export function signToken(userId: number, secret: string, now: Date): string {
  // iat comes from the injected clock so expiry does not depend on Date.now().
  return jwt.sign({ iat: Math.floor(now.getTime() / 1000) }, secret, {
    subject: String(userId),
    algorithm: "HS256",
    expiresIn: JWT_EXPIRES_IN,
  });
}

/** Returns the user id, or null when the token is missing, expired or forged. */
export function verifyToken(
  token: string,
  secret: string,
  now: Date,
): number | null {
  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      clockTimestamp: Math.floor(now.getTime() / 1000),
    });
    if (typeof payload === "string") return null;
    const userId = Number(payload.sub);
    return Number.isInteger(userId) ? userId : null;
  } catch {
    return null;
  }
}
