export type InlineSpan =
  | { type: "text"; text: string }
  | { type: "pageRef"; label: string }
  | { type: "tag"; label: string; bracketed: boolean }
  | { type: "blockRef"; id: string }
  | { type: "blockEmbed"; id: string };

export type BlockNode =
  | { type: "property"; key: string; value: string }
  | { type: "bullet"; depth: number; inlines: InlineSpan[]; children: BlockNode[] }
  | { type: "paragraph"; inlines: InlineSpan[] };

export type BlockForest = BlockNode[];
