import { describe, it, expect } from "vitest";
import { parseLogseqMarkdown } from "./parser";
import { parseInline } from "./inline-parser";
import { logseqMarkdownToTiptap } from "./to-tiptap";

describe("parseInline", () => {
  it("parses page references and tags", () => {
    const spans = parseInline("Read [[Next.js]] #work");
    expect(spans.some((s) => s.type === "pageRef")).toBe(true);
    expect(spans.some((s) => s.type === "tag")).toBe(true);
  });
});

describe("parseLogseqMarkdown", () => {
  it("parses nested bullets", () => {
    const forest = parseLogseqMarkdown(`- Parent
  - Child
    - Grandchild
- Sibling`);

    expect(forest.length).toBe(2);
    const parent = forest[0];
    expect(parent.type).toBe("bullet");
    if (parent.type === "bullet") {
      expect(parent.children.length).toBe(1);
    }
  });

  it("parses properties", () => {
    const forest = parseLogseqMarkdown(`status:: active
- Task`);
    expect(forest[0].type).toBe("property");
  });
});

describe("logseqMarkdownToTiptap", () => {
  it("produces a doc with bulletList", () => {
    const doc = logseqMarkdownToTiptap("- Hello [[World]]");
    expect(doc.type).toBe("doc");
    const content = doc.content as { type: string }[];
    expect(content.some((n) => n.type === "bulletList")).toBe(true);
  });
});
