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

export async function listPages() {
  return db.query.pages.findMany({
    where: ne(pages.type, "journal"),
    orderBy: [desc(pages.updatedAt)],
  });
}

export async function listJournals(limit = 30) {
  return db.query.pages.findMany({
    where: eq(pages.type, "journal"),
    orderBy: [desc(pages.journalDate)],
    limit,
  });
}

export async function getPageBySlug(slug: string) {
  return db.query.pages.findFirst({
    where: eq(pages.slug, slug),
    with: { document: true },
  });
}

export async function getPageById(id: string) {
  return db.query.pages.findFirst({
    where: eq(pages.id, id),
    with: { document: true },
  });
}

export async function createPage(name: string) {
  const slug = pageSlugFromName(name);
  const existing = await getPageBySlug(slug);
  if (existing) return existing;

  const [page] = await db
    .insert(pages)
    .values({
      name,
      slug,
      type: "page",
    })
    .returning();

  await ensureDocument(page.id);

  return getPageById(page.id);
}

export async function getOrCreateJournal(dateStr: string) {
  const slug = journalSlugFromDate(dateStr);
  let page = await getPageBySlug(slug);

  if (!page) {
    const parsed = parseISO(`${dateStr}T12:00:00`);
    const name = format(parsed, "MMM do, yyyy");

    const [created] = await db
      .insert(pages)
      .values({
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

export async function getJournalFeed(dayCount = 14) {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dates.push(format(d, "yyyy-MM-dd"));
  }

  const entries = await Promise.all(dates.map((d) => getOrCreateJournal(d)));
  return entries;
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

  await syncLinksForPage(pageId, plainText);

  return { plainText };
}

async function syncLinksForPage(sourcePageId: string, plainText: string) {
  const names = extractPageNamesFromText(plainText);
  await db.delete(links).where(eq(links.sourcePageId, sourcePageId));

  for (const name of names) {
    const slug = pageSlugFromName(name);
    const target = await db.query.pages.findFirst({
      where: eq(pages.slug, slug),
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

export async function getGraphData() {
  const allPages = await db.query.pages.findMany();
  const allLinks = await db.query.links.findMany();

  return {
    nodes: allPages.map((p) => ({
      id: p.id,
      label: p.name,
      slug: p.slug,
      type: p.type,
      journalDate: p.journalDate,
    })),
    edges: allLinks.map((l) => ({
      id: l.id,
      source: l.sourcePageId,
      target: l.targetPageId,
    })),
  };
}

export async function findPageByName(name: string) {
  const slug = pageSlugFromName(name);
  return getPageBySlug(slug);
}
