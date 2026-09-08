/**
 * A tiny, SAFE Markdown subset.
 *
 * Parses a bounded set of Markdown into a plain node tree. It never produces
 * HTML — the renderer (`src/components/rich-text.tsx`) emits only known React
 * elements, and React escapes all text — so there is no HTML-injection surface.
 * Unrecognised syntax is left as literal text.
 *
 * Supported: `#`/`##`/`###` headings, `**bold**`, `*italic*`/`_italic_`,
 * `` `code` ``, `[text](url)`, `![alt](url)`, `-`/`*` bullet lists, `1.` ordered
 * lists, `>` blockquotes, paragraphs, and single-newline soft breaks. Links and
 * images are URL-validated; anything not allowed renders as plain text.
 *
 * Pure module: no imports with side effects, safe on client and server.
 */

export type InlineNode =
  | { t: "text"; v: string }
  | { t: "strong"; c: InlineNode[] }
  | { t: "em"; c: InlineNode[] }
  | { t: "code"; v: string }
  | { t: "br" }
  | { t: "link"; href: string; c: InlineNode[] }
  | { t: "img"; src: string; alt: string };

export type BlockNode =
  | { t: "p"; c: InlineNode[] }
  | { t: "h"; level: 1 | 2 | 3; c: InlineNode[] }
  | { t: "ul"; items: InlineNode[][] }
  | { t: "ol"; items: InlineNode[][] }
  | { t: "quote"; c: InlineNode[] }
  | { t: "img"; src: string; alt: string };

/** Accept only an http(s) link. Returns null (drop to text) when unsafe. */
export function safeHref(raw: string): string | null {
  const value = String(raw ?? "").trim();
  if (!value || value.length > 2048) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.toString();
  } catch {
    /* not an absolute URL */
  }
  return null;
}

/** Image src: http(s), or a same-origin media/static path. Null when unsafe. */
export function safeImgSrc(raw: string): string | null {
  const value = String(raw ?? "").trim();
  if (!value || value.length > 2048) return null;
  if (/^\/(media|api\/media|game|slides|__grok)\/[a-z0-9/_.:-]+$/i.test(value)) return value;
  return safeHref(value);
}

const INLINE_PATTERNS: { re: RegExp; make: (m: RegExpExecArray) => InlineNode | null }[] = [
  // image ![alt](src)
  {
    re: /!\[([^\]]*)\]\(([^)\s]+)\)/,
    make: (m) => {
      const src = safeImgSrc(m[2]);
      return src ? { t: "img", src, alt: m[1] } : null;
    },
  },
  // link [text](href)
  {
    re: /\[([^\]]+)\]\(([^)\s]+)\)/,
    make: (m) => {
      const href = safeHref(m[2]);
      return href ? { t: "link", href, c: parseInline(m[1]) } : null;
    },
  },
  // bold **text**
  { re: /\*\*([^*]+)\*\*/, make: (m) => ({ t: "strong", c: parseInline(m[1]) }) },
  // italic *text* or _text_
  { re: /(?:\*([^*]+)\*|_([^_]+)_)/, make: (m) => ({ t: "em", c: parseInline(m[1] ?? m[2]) }) },
  // inline code `code`
  { re: /`([^`]+)`/, make: (m) => ({ t: "code", v: m[1] }) },
];

/** Parse inline markdown into nodes. Earliest match wins; the rest is literal. */
export function parseInline(text: string): InlineNode[] {
  const src = String(text ?? "");
  if (!src) return [];
  let best: { index: number; length: number; node: InlineNode } | null = null;
  for (const { re, make } of INLINE_PATTERNS) {
    const m = re.exec(src);
    if (!m) continue;
    if (best && m.index >= best.index) continue;
    const node = make(m);
    if (!node) continue; // unsafe (e.g. bad URL) — treat as plain text
    best = { index: m.index, length: m[0].length, node };
  }
  if (!best) return [{ t: "text", v: src }];
  const nodes: InlineNode[] = [];
  if (best.index > 0) nodes.push({ t: "text", v: src.slice(0, best.index) });
  nodes.push(best.node);
  nodes.push(...parseInline(src.slice(best.index + best.length)));
  return nodes;
}

function inlineWithBreaks(lines: string[]): InlineNode[] {
  const out: InlineNode[] = [];
  lines.forEach((line, i) => {
    if (i > 0) out.push({ t: "br" });
    out.push(...parseInline(line));
  });
  return out;
}

const H = /^(#{1,3})\s+(.*)$/;
const UL = /^[-*]\s+(.*)$/;
const OL = /^\d+\.\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const IMG_ONLY = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

/** Parse a Markdown string (possibly multi-line) into block nodes. */
export function parseMarkdown(src: string): BlockNode[] {
  const lines = String(src ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks: BlockNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const heading = H.exec(line);
    if (heading) {
      blocks.push({ t: "h", level: heading[1].length as 1 | 2 | 3, c: parseInline(heading[2]) });
      i += 1;
      continue;
    }
    if (UL.test(line)) {
      const items: InlineNode[][] = [];
      while (i < lines.length && UL.test(lines[i])) {
        items.push(parseInline(UL.exec(lines[i])![1]));
        i += 1;
      }
      blocks.push({ t: "ul", items });
      continue;
    }
    if (OL.test(line)) {
      const items: InlineNode[][] = [];
      while (i < lines.length && OL.test(lines[i])) {
        items.push(parseInline(OL.exec(lines[i])![1]));
        i += 1;
      }
      blocks.push({ t: "ol", items });
      continue;
    }
    if (QUOTE.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        quoteLines.push(QUOTE.exec(lines[i])![1]);
        i += 1;
      }
      blocks.push({ t: "quote", c: inlineWithBreaks(quoteLines) });
      continue;
    }
    // paragraph: gather consecutive plain lines
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !H.test(lines[i]) &&
      !UL.test(lines[i]) &&
      !OL.test(lines[i]) &&
      !QUOTE.test(lines[i])
    ) {
      para.push(lines[i]);
      i += 1;
    }
    if (para.length === 1) {
      const only = IMG_ONLY.exec(para[0].trim());
      if (only) {
        const src2 = safeImgSrc(only[2]);
        if (src2) {
          blocks.push({ t: "img", src: src2, alt: only[1] });
          continue;
        }
      }
    }
    blocks.push({ t: "p", c: inlineWithBreaks(para) });
  }
  return blocks;
}

/** True when a string contains any of the supported markdown markers. */
export function looksLikeMarkdown(src: string): boolean {
  return /(^|\n)\s*(#{1,3}\s|[-*]\s|\d+\.\s|>\s)|\*\*|__|`|\[[^\]]+\]\([^)]+\)|!\[[^\]]*\]\([^)]+\)|(?:^|\W)[*_][^*_\s]/.test(
    String(src ?? ""),
  );
}
