import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createApp } from "./app.ts";
import { loadConfig } from "./config.ts";
import { createDb } from "./db/client.ts";
import { seedCatalogue } from "./db/seed.ts";
import { systemClock } from "./lib/clock.ts";
import { createMailer } from "./lib/mailer.ts";
import { createAuthRepo } from "./modules/auth/repo.ts";
import { createAuthService } from "./modules/auth/service.ts";
import { createProfileRepo } from "./modules/profile/repo.ts";
import { createProfileService } from "./modules/profile/service.ts";
import { createTasksRepo } from "./modules/tasks/repo.ts";
import { createTasksService } from "./modules/tasks/service.ts";

try {
  const config = loadConfig(process.env);
  const { pool, db } = createDb(config.databaseUrl);

  // Migrating at startup keeps the reviewer's path to one Docker command.
  await migrate(db, { migrationsFolder: "./drizzle" });
  await seedCatalogue(db);

  const auth = createAuthService({
    repo: createAuthRepo(db),
    clock: systemClock,
    mailer: createMailer({
      host: config.smtpHost,
      port: config.smtpPort,
      from: config.mailFrom,
    }),
    otpSecret: config.otpSecret,
    jwtSecret: config.jwtSecret,
  });

  const app = createApp({
    pool,
    auth,
    profile: createProfileService(createProfileRepo(db)),
    tasks: createTasksService({
      repo: createTasksRepo(db),
      clock: systemClock,
    }),
    jwtSecret: config.jwtSecret,
    clock: systemClock,
  });

  app.listen(config.port, () => {
    console.log(`API listening on port ${config.port}`);
  });
} catch (err) {
  console.error(err instanceof Error ? err.message : "Failed to start the API.");
  process.exit(1);
}
