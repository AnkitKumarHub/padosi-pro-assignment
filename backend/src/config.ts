import { z } from "zod";

const positiveInt = z
  .string()
  .min(1)
  .superRefine((value, ctx) => {
    if (!/^[1-9]\d*$/.test(value)) {
      ctx.addIssue({
        code: "custom",
        message: "Must be a positive integer.",
      });
    }
  })
  .transform((value) => Number(value));

const configSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    OTP_SECRET: z.string().min(32),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: positiveInt,
    MAIL_FROM: z.string().min(1),
    PORT: positiveInt,
  })
  .superRefine((value, ctx) => {
    if (value.JWT_SECRET === value.OTP_SECRET) {
      ctx.addIssue({
        code: "custom",
        message: "JWT_SECRET and OTP_SECRET must be different.",
        path: ["OTP_SECRET"],
      });
    }
  });

export type AppConfig = {
  databaseUrl: string;
  jwtSecret: string;
  otpSecret: string;
  smtpHost: string;
  smtpPort: number;
  mailFrom: string;
  port: number;
};

export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const parsed = configSchema.safeParse({
    DATABASE_URL: env.DATABASE_URL,
    JWT_SECRET: env.JWT_SECRET,
    OTP_SECRET: env.OTP_SECRET,
    SMTP_HOST: env.SMTP_HOST,
    SMTP_PORT: env.SMTP_PORT,
    MAIL_FROM: env.MAIL_FROM,
    PORT: env.PORT,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "config"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid configuration. ${details}`);
  }

  return {
    databaseUrl: parsed.data.DATABASE_URL,
    jwtSecret: parsed.data.JWT_SECRET,
    otpSecret: parsed.data.OTP_SECRET,
    smtpHost: parsed.data.SMTP_HOST,
    smtpPort: parsed.data.SMTP_PORT,
    mailFrom: parsed.data.MAIL_FROM,
    port: parsed.data.PORT,
  };
}
