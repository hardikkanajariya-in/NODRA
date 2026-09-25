import { describe, it, expect } from "vitest";
import { parseLogseqDbClipboard } from "./db-clipboard";

const SAMPLE = `{:pages-and-blocks
 [{:page {:build/journal 20260919},
   :blocks
   [{:block/title
     "~~Make a dentist question answer to place below the doctors answers in PDF~~",
     :block/collapsed? false,
     :build/children
     [{:block/title "2026-09-19-22-24-09",
       :build/tags #{:logseq.class/Asset},
       :build/properties
       {:logseq.property.asset/type "png",
        :logseq.property.asset/resize-metadata
        {:width 372.3999328613281},
        :logseq.property.asset/width 932,
        :logseq.property.asset/height 833}}]}]}]}`;

describe("parseLogseqDbClipboard", () => {
  it("nests an asset block under the parent with display width", () => {
    const forest = parseLogseqDbClipboard(SAMPLE);
    expect(forest).not.toBeNull();
    const root = forest![0];
    expect(root.type).toBe("bullet");
    if (root.type !== "bullet") return;
    expect(root.done).toBe(true);
    expect(root.children).toHaveLength(1);
    const child = root.children[0];
    if (child.type !== "bullet") return;
    expect(child.imageHint).toBe("2026-09-19-22-24-09");
    expect(child.imageWidth).toBe(372);
  });
});
