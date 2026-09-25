import { describe, it, expect } from "vitest";
import { parseLogseqMarkdown } from "./parser";
import { parseBulletContent } from "./bullet-content";
import { prepareLogseqPaste } from "./paste-to-tiptap";
import type { ImagePool } from "./clipboard-images";

function mockClipboard(text: string): DataTransfer {
  return {
    types: ["text/plain"],
    getData: (type: string) => (type === "text/plain" ? text : ""),
    files: [] as unknown as FileList,
    items: [] as unknown as DataTransferItemList,
  } as unknown as DataTransfer;
}

const emptyPool: ImagePool = { byName: new Map(), ordered: [] };

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

describe("prepareLogseqPaste", () => {
  it("queues upload jobs from resolveLocalFile", async () => {
    const file = new File(["pixels"], "2026-09-19-22-24-09.png", {
      type: "image/png",
    });
    const prepared = await prepareLogseqPaste(
      mockClipboard("- 2026-09-19-22-24-09"),
      emptyPool,
      {
        resolveLocalFile: async () => file,
      },
    );
    expect(prepared.jobs).toHaveLength(1);
    expect(prepared.jobs[0]?.file.name).toBe("2026-09-19-22-24-09.png");
  });
});
