export type DocJson = Record<string, unknown>;

export const emptyLogseqDoc: DocJson = {
  type: "doc",
  content: [
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [{ type: "paragraph" }],
        },
      ],
    },
  ],
};

/** Logseq-style: top-level blocks live in bullet lists, not bare paragraphs. */
export function normalizeDocToBullets(doc: DocJson): DocJson {
  if (doc.type !== "doc") return emptyLogseqDoc;

  const content = Array.isArray(doc.content)
    ? (doc.content as DocJson[])
    : [];

  if (content.length === 0) return emptyLogseqDoc;

  const onlyEmptyParagraph =
    content.length === 1 &&
    content[0].type === "paragraph" &&
    (!Array.isArray(content[0].content) ||
      (content[0].content as unknown[]).length === 0);

  if (onlyEmptyParagraph) return emptyLogseqDoc;

  const out: DocJson[] = [];
  let batch: DocJson[] = [];

  const flush = () => {
    if (!batch.length) return;
    out.push({ type: "bulletList", content: batch });
    batch = [];
  };

  for (const node of content) {
    const type = node.type as string;
    if (type === "bulletList") {
      flush();
      out.push(node);
      continue;
    }
    if (type === "propertyBlock") {
      flush();
      out.push(node);
      continue;
    }
    if (type === "paragraph" || type === "image") {
      batch.push({ type: "listItem", content: [node] });
      continue;
    }
    if (type === "taskList") {
      batch.push({ type: "listItem", content: [node] });
      continue;
    }
    batch.push({
      type: "listItem",
      content: [{ type: "paragraph", content: node.content ?? [] }],
    });
  }

  flush();
  if (!out.length) return emptyLogseqDoc;
  return { type: "doc", content: out };
}
