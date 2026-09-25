import { describe, it, expect } from "vitest";
import { parseLogseqMarkdown } from "./parser";
import { parseBulletContent } from "./bullet-content";

describe("parseBulletContent", () => {
  it("parses strikethrough done blocks", () => {
    const r = parseBulletContent("~~Make a dentist question answer~~");
    expect(r.done).toBe(true);
    expect(r.inlines[0]).toMatchObject({ type: "text", text: expect.any(String) });
  });

  it("detects logseq asset filename lines", () => {
    const r = parseBulletContent("2026-09-19-22-24-09");
    expect(r.imageHint).toBe("2026-09-19-22-24-09");
  });
});

describe("parseLogseqMarkdown", () => {
  it("parses tab-indented nested bullets", () => {
    const forest = parseLogseqMarkdown(
      "- Parent\n\t- Child asset\n\t\t- Grandchild",
    );
    expect(forest.length).toBe(1);
    const parent = forest[0];
    if (parent.type === "bullet") {
      expect(parent.children.length).toBeGreaterThan(0);
    }
  });
});
