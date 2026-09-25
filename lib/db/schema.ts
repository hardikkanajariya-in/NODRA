import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  jsonb,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    type: text("type").notNull().$type<"page" | "journal">(),
    journalDate: date("journal_date"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("pages_slug_idx").on(t.slug),
    index("pages_journal_date_idx").on(t.journalDate),
    index("pages_type_idx").on(t.type),
  ],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    contentJson: jsonb("content_json").notNull().$type<Record<string, unknown>>(),
    plainText: text("plain_text").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("documents_page_id_idx").on(t.pageId)],
);

export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const links = pgTable(
  "links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourcePageId: uuid("source_page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    targetPageId: uuid("target_page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("links_source_target_idx").on(t.sourcePageId, t.targetPageId),
    index("links_source_idx").on(t.sourcePageId),
    index("links_target_idx").on(t.targetPageId),
  ],
);

export const pagesRelations = relations(pages, ({ one, many }) => ({
  document: one(documents, {
    fields: [pages.id],
    references: [documents.pageId],
  }),
  assets: many(assets),
  outgoingLinks: many(links, { relationName: "source" }),
  incomingLinks: many(links, { relationName: "target" }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  page: one(pages, {
    fields: [documents.pageId],
    references: [pages.id],
  }),
}));
