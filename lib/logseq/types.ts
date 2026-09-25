export type InlineSpan =
  | { type: "text"; text: string; strike?: boolean; bold?: boolean }
  | { type: "pageRef"; label: string }
  | { type: "tag"; label: string; bracketed: boolean }
  | { type: "blockRef"; id: string }
  | { type: "blockEmbed"; id: string }
  | { type: "image"; alt: string; url: string };

export type BlockNode =
  | { type: "property"; key: string; value: string }
  | {
      type: "bullet";
      depth: number;
      inlines: InlineSpan[];
      children: BlockNode[];
      done?: boolean;
      imageHint?: string;
      /** Display width from Logseq asset resize metadata. */
      imageWidth?: number;
    }
  | { type: "paragraph"; inlines: InlineSpan[] };

export type BlockForest = BlockNode[];
