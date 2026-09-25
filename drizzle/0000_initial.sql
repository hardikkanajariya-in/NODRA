CREATE TABLE IF NOT EXISTS "pages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "type" text NOT NULL,
  "journal_date" date,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "pages_slug_idx" ON "pages" ("slug");
CREATE INDEX IF NOT EXISTS "pages_journal_date_idx" ON "pages" ("journal_date");
CREATE INDEX IF NOT EXISTS "pages_type_idx" ON "pages" ("type");

CREATE TABLE IF NOT EXISTS "documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "page_id" uuid NOT NULL,
  "content_json" jsonb NOT NULL,
  "plain_text" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "documents_page_id_idx" ON "documents" ("page_id");

CREATE TABLE IF NOT EXISTS "assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "page_id" uuid NOT NULL,
  "storage_key" text NOT NULL,
  "original_name" text NOT NULL,
  "mime_type" text NOT NULL,
  "size" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source_page_id" uuid NOT NULL,
  "target_page_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "links_source_target_idx" ON "links" ("source_page_id", "target_page_id");
CREATE INDEX IF NOT EXISTS "links_source_idx" ON "links" ("source_page_id");
CREATE INDEX IF NOT EXISTS "links_target_idx" ON "links" ("target_page_id");

ALTER TABLE "documents" ADD CONSTRAINT "documents_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "assets" ADD CONSTRAINT "assets_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "links" ADD CONSTRAINT "links_source_page_id_pages_id_fk" FOREIGN KEY ("source_page_id") REFERENCES "pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "links" ADD CONSTRAINT "links_target_page_id_pages_id_fk" FOREIGN KEY ("target_page_id") REFERENCES "pages"("id") ON DELETE cascade ON UPDATE no action;
