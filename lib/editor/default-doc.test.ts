import { describe, it, expect } from "vitest";
import { emptyLogseqDoc, normalizeDocToBullets } from "./default-doc";

describe("normalizeDocToBullets", () => {
  it("uses bullet list for empty docs", () => {
    const out = normalizeDocToBullets({
      type: "doc",
      content: [{ type: "paragraph" }],
    });
    expect(out).toEqual(emptyLogseqDoc);
  });

  it("wraps top-level paragraphs in a bullet list", () => {
    const out = normalizeDocToBullets({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "This is list" }],
        },
      ],
    });
    const list = (out.content as unknown[])[0] as { type: string };
    expect(list.type).toBe("bulletList");
  });
});
