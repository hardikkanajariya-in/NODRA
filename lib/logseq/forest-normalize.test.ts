import { describe, it, expect } from "vitest";
import { parseLogseqMarkdown } from "./parser";
import { normalizePastedForest } from "./forest-normalize";

describe("normalizePastedForest", () => {
  it("nests tab-indented bullets under a leading paragraph line", () => {
    const raw = parseLogseqMarkdown(
      "~~Parent task~~\n\t- 2026-09-19-22-24-09",
    );
    const forest = normalizePastedForest(raw);
    expect(forest.length).toBe(1);
    const root = forest[0];
    if (root.type === "bullet") {
      expect(root.children.length).toBe(1);
      const child = root.children[0];
      if (child.type === "bullet") {
        expect(child.imageHint).toBe("2026-09-19-22-24-09");
      }
    }
  });
});
