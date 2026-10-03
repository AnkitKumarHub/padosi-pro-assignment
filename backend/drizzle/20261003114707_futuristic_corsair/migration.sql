CREATE TABLE "categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(120) NOT NULL UNIQUE,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" integer PRIMARY KEY,
	"name" varchar(80) NOT NULL,
	"mobile_number" varchar(13) NOT NULL,
	"address" varchar(300) NOT NULL,
	"business_name" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tasks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"category_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "tasks_category_id_name_unique" UNIQUE("category_id","name")
);
--> statement-breakpoint
CREATE TABLE "user_tasks" (
	"user_id" integer,
	"task_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_tasks_pkey" PRIMARY KEY("user_id","task_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "task_selection_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_tasks" ADD CONSTRAINT "user_tasks_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_tasks" ADD CONSTRAINT "user_tasks_task_id_tasks_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT;