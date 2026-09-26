CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "username" text NOT NULL,
  "username_key" text NOT NULL,
  "password_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key_idx" ON "users" ("username_key");

ALTER TABLE "graphs" ADD COLUMN IF NOT EXISTS "owner_user_id" uuid;

DO $$ BEGIN
  ALTER TABLE "graphs" ADD CONSTRAINT "graphs_owner_user_id_users_id_fk"
    FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "graph_shares" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "graph_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "graph_shares_graph_user_idx" ON "graph_shares" ("graph_id", "user_id");
CREATE INDEX IF NOT EXISTS "graph_shares_user_id_idx" ON "graph_shares" ("user_id");

DO $$ BEGIN
  ALTER TABLE "graph_shares" ADD CONSTRAINT "graph_shares_graph_id_graphs_id_fk"
    FOREIGN KEY ("graph_id") REFERENCES "graphs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "graph_shares" ADD CONSTRAINT "graph_shares_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
