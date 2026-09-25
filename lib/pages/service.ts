import { eq, and, desc, ne } from "drizzle-orm";
import { format, parseISO } from "date-fns";
import { db } from "@/lib/db/client";
import { documents, pages, links } from "@/lib/db/schema";
import { pageSlugFromName, journalSlugFromDate } from "@/lib/utils/slug";
import {
  extractPageNamesFromText,
  extractPlainTextFromTiptap,
} from "@/lib/links/extract";
import { emptyDoc, ensureDocument } from "@/lib/pages/document";
import { journalDocumentHasContent } from "@/lib/editor/doc-content";

export async function listPages(graphId: string) {
  return db.query.pages.findMany({
    where: and(eq(pages.graphId, graphId), ne(pages.type, "journal")),
    orderBy: [desc(pages.updatedAt)],
  });
}

export async function listJournals(graphId: string, limit = 30) {
  return db.query.pages.findMany({
    where: and(eq(pages.graphId, graphId), eq(pages.type, "journal")),
    orderBy: [desc(pages.journalDate)],
    limit,
  });
}

export async function getPageBySlug(graphId: string, slug: string) {
  return db.query.pages.findFirst({
    where: and(eq(pages.graphId, graphId), eq(pages.slug, slug)),
    with: { document: true },
  });
}

export async function getPageById(id: string) {
  return db.query.pages.findFirst({
    where: eq(pages.id, id),
    with: { document: true },
  });
}

export async function createPage(graphId: string, name: string) {
  const slug = pageSlugFromName(name);
  const existing = await getPageBySlug(graphId, slug);
  if (existing) return existing;

  const [page] = await db
    .insert(pages)
    .values({
      graphId,
      name,
      slug,
      type: "page",
    })
    .returning();

  await ensureDocument(page.id);

  return getPageById(page.id);
}

export async function getOrCreateJournal(graphId: string, dateStr: string) {
  const slug = journalSlugFromDate(dateStr);
  let page = await getPageBySlug(graphId, slug);

  if (!page) {
    const parsed = parseISO(`${dateStr}T12:00:00`);
    const name = format(parsed, "MMM do, yyyy");

    const [created] = await db
      .insert(pages)
      .values({
        graphId,
        name,
        slug,
        type: "journal",
        journalDate: dateStr,
      })
      .returning();

    await ensureDocument(created.id);
    page = await getPageById(created.id);
  } else if (!page.document) {
    await ensureDocument(page.id);
    page = await getPageById(page.id);
  }

  if (!page?.document) {
    throw new Error("Journal page exists but document could not be loaded.");
  }

  return page;
}

export async function getJournalFeed(graphId: string, fetchLimit = 60) {
  const today = format(new Date(), "yyyy-MM-dd");
  const todayPage = await getOrCreateJournal(graphId, today);

  const rows = await db.query.pages.findMany({
    where: and(eq(pages.graphId, graphId), eq(pages.type, "journal")),
    orderBy: [desc(pages.journalDate)],
    limit: fetchLimit,
    with: { document: true },
  });

  const byId = new Map(rows.map((row) => [row.id, row]));
  byId.set(todayPage.id, todayPage);

  const visible = [...byId.values()].filter((page) => {
    if (page.journalDate === today) return true;
    const doc = page.document?.contentJson as Record<string, unknown> | undefined;
    return doc ? journalDocumentHasContent(doc) : false;
  });

  visible.sort((a, b) => {
    const da = a.journalDate ?? "";
    const db = b.journalDate ?? "";
    return db.localeCompare(da);
  });

  return visible;
}

export async function updatePageName(id: string, name: string) {
  const slug = pageSlugFromName(name);
  const [updated] = await db
    .update(pages)
    .set({ name, slug, updatedAt: new Date() })
    .where(and(eq(pages.id, id), eq(pages.type, "page")))
    .returning();
  return updated;
}

export async function deletePage(id: string) {
  await db.delete(pages).where(eq(pages.id, id));
}

export async function saveDocument(
  pageId: string,
  contentJson: Record<string, unknown>,
) {
  const plainText =
    extractPlainTextFromTiptap(contentJson) ||
    JSON.stringify(contentJson).slice(0, 5000);

  const page = await getPageById(pageId);
  if (!page) throw new Error("Page not found");

  const existing = await db.query.documents.findFirst({
    where: eq(documents.pageId, pageId),
  });

  if (existing) {
    await db
      .update(documents)
      .set({
        contentJson,
        plainText,
        updatedAt: new Date(),
      })
      .where(eq(documents.pageId, pageId));
  } else {
    await db.insert(documents).values({
      pageId,
      contentJson,
      plainText,
    });
  }

  await db
    .update(pages)
    .set({ updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  await syncLinksForPage(page.graphId, pageId, plainText);

  return { plainText };
}

async function syncLinksForPage(
  graphId: string,
  sourcePageId: string,
  plainText: string,
) {
  const names = extractPageNamesFromText(plainText);
  await db.delete(links).where(eq(links.sourcePageId, sourcePageId));

  for (const name of names) {
    const slug = pageSlugFromName(name);
    const target = await db.query.pages.findFirst({
      where: and(eq(pages.graphId, graphId), eq(pages.slug, slug)),
    });
    if (!target || target.id === sourcePageId) continue;

    try {
      await db.insert(links).values({
        sourcePageId,
        targetPageId: target.id,
      });
    } catch {
      // duplicate link pair
    }
  }
}

export async function getGraphData(graphId: string) {
  const graphPages = await db.query.pages.findMany({
    where: eq(pages.graphId, graphId),
  });
  const pageIds = new Set(graphPages.map((p) => p.id));
  const allLinks = await db.query.links.findMany();

  const edges = allLinks.filter(
    (l) => pageIds.has(l.sourcePageId) && pageIds.has(l.targetPageId),
  );

  return {
    nodes: graphPages.map((p) => ({
      id: p.id,
      label: p.name,
      slug: p.slug,
      type: p.type,
      journalDate: p.journalDate,
    })),
    edges: edges.map((l) => ({
      id: l.id,
      source: l.sourcePageId,
      target: l.targetPageId,
    })),
  };
}

export async function findPageByName(graphId: string, name: string) {
  const slug = pageSlugFromName(name);
  return getPageBySlug(graphId, slug);
}
