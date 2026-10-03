import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 254 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  taskSelectionCompletedAt: timestamp("task_selection_completed_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const otpChallenges = pgTable("otp_challenges", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer().notNull().default(0),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  lastSentAt: timestamp("last_sent_at", { withTimezone: true }).notNull(),
});

export const profiles = pgTable("profiles", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar({ length: 80 }).notNull(),
  mobileNumber: varchar("mobile_number", { length: 13 }).notNull(),
  address: varchar({ length: 300 }).notNull(),
  businessName: varchar("business_name", { length: 120 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 120 }).notNull().unique(),
  description: text().notNull(),
});

export const tasks = pgTable(
  "tasks",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: varchar({ length: 120 }).notNull(),
    description: text().notNull(),
  },
  (table) => [unique().on(table.categoryId, table.name)],
);

export const userTasks = pgTable(
  "user_tasks",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.taskId] })],
);
