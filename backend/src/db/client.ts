import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export function createDb(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  return { pool, db: drizzle({ client: pool }) };
}

export type Db = ReturnType<typeof createDb>["db"];
