import type { InlineSpan } from "./types";

const PAGE_REF = /\[\[([^\]]+)\]\]/g;
const BLOCK_REF = /\(\(([0-9a-f-]{36})\)\)/gi;
const BLOCK_EMBED =
  /\{\{embed\s+\(\(([0-9a-f-]{36})\)\)\}\}/gi;
const TAG_BRACKET = /#\[\[([^\]]+)\]\]/g;
const TAG_SIMPLE = /#([^\s#\[.,;:!?]+)/g;
const IMAGE_MD = /!\[([^\]]*)\]\(([^)]+)\)/g;
const STRIKE = /~~([^~]+)~~/g;
const BOLD = /\*\*([^*]+)\*\*/g;

type Token =
  | { kind: "text"; start: number; end: number; text: string }
  | { kind: "pageRef"; start: number; end: number; label: string }
  | { kind: "blockRef"; start: number; end: number; id: string }
  | { kind: "blockEmbed"; start: number; end: number; id: string }
  | { kind: "tag"; start: number; end: number; label: string; bracketed: boolean }
  | { kind: "image"; start: number; end: number; alt: string; url: string }
  | { kind: "strike"; start: number; end: number; text: string }
  | { kind: "bold"; start: number; end: number; text: string };

function collectTokens(input: string): Token[] {
  const tokens: Token[] = [];

  const addMatches = (regex: RegExp, map: (m: RegExpExecArray) => Token) => {
    const re = new RegExp(regex.source, regex.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(input)) !== null) {
      tokens.push(map(m));
    }
  };

  addMatches(BLOCK_EMBED, (m) => ({
    kind: "blockEmbed",
    start: m.index,
    end: m.index + m[0].length,
    id: m[1],
  }));

  addMatches(BLOCK_REF, (m) => ({
    kind: "blockRef",
    start: m.index,
    end: m.index + m[0].length,
    id: m[1],
  }));

  addMatches(PAGE_REF, (m) => ({
    kind: "pageRef",
    start: m.index,
    end: m.index + m[0].length,
    label: m[1].trim(),
  }));

  addMatches(TAG_BRACKET, (m) => ({
    kind: "tag",
    start: m.index,
    end: m.index + m[0].length,
    label: m[1].trim(),
    bracketed: true,
  }));

  addMatches(TAG_SIMPLE, (m) => ({
    kind: "tag",
    start: m.index,
    end: m.index + m[0].length,
    label: m[1].trim(),
    bracketed: false,
  }));

  addMatches(IMAGE_MD, (m) => ({
    kind: "image",
    start: m.index,
    end: m.index + m[0].length,
    alt: m[1],
    url: m[2],
  }));

  addMatches(STRIKE, (m) => ({
    kind: "strike",
    start: m.index,
    end: m.index + m[0].length,
    text: m[1],
  }));

  addMatches(BOLD, (m) => ({
    kind: "bold",
    start: m.index,
    end: m.index + m[0].length,
    text: m[1],
  }));

  tokens.sort((a, b) => a.start - b.start);

  const filtered: Token[] = [];
  let cursor = 0;
  for (const t of tokens) {
    if (t.start < cursor) continue;
    filtered.push(t);
    cursor = t.end;
  }

  return filtered;
}

export function parseInline(text: string): InlineSpan[] {
  if (!text) return [{ type: "text", text: "" }];

  const tokens = collectTokens(text);
  const spans: InlineSpan[] = [];
  let pos = 0;

  for (const t of tokens) {
    if (t.start > pos) {
      spans.push({ type: "text", text: text.slice(pos, t.start) });
    }
    switch (t.kind) {
      case "pageRef":
        spans.push({ type: "pageRef", label: t.label });
        break;
      case "blockRef":
        spans.push({ type: "blockRef", id: t.id });
        break;
      case "blockEmbed":
        spans.push({ type: "blockEmbed", id: t.id });
        break;
      case "tag":
        spans.push({
          type: "tag",
          label: t.label,
          bracketed: t.bracketed,
        });
        break;
      case "image":
        spans.push({ type: "image", alt: t.alt, url: t.url });
        break;
      case "strike":
        spans.push({ type: "text", text: t.text, strike: true });
        break;
      case "bold":
        spans.push({ type: "text", text: t.text, bold: true });
        break;
      default:
        break;
    }
    pos = t.end;
  }

  if (pos < text.length) {
    spans.push({ type: "text", text: text.slice(pos) });
  }

  return spans.length ? spans : [{ type: "text", text }];
}
