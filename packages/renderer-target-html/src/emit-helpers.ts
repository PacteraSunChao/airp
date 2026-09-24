import type { SchemaVersion } from "@airp/protocol";
import type {
  InlineNode,
  LocaleFormatContext,
  LocalizedString,
  RichText,
} from "@airp/renderer-shared";
import { isBlockBase } from "@airp/renderer-shared";
import type { PageTocEntry } from "./components/page-toc.js";
import { escapeHtml } from "./shared/escape-html.js";

/** Shared mutable counter — must survive `childHeadingCtx` shallow copies. */
export interface EmitSequence {
  next: number;
}

export type EmitContext = LocaleFormatContext & {
  headingLevel: number;
  /** Document schema version (drives @id vs id, citation display, etc.). */
  schemaVersion: SchemaVersion;
  /** Increments per Mermaid figure in this document emit. */
  mermaidViewerSeq: EmitSequence;
  /** Increments per collapsible block in this document emit (1.0.0 fallback). */
  collapsibleSeq: EmitSequence;
  /** Assigned section anchor ids in this document emit. */
  sectionIds: Set<string>;
  /** Outline rows for the floating page TOC (document order). */
  tocEntries: PageTocEntry[];
  /** Increments per tabs block in this document emit. */
  tabsSeq: EmitSequence;
  /** Count of emitted top-level (`level === 1`) sections in this document. */
  topSectionCount: number;
  /**
   * Consume the next pre-rendered Mermaid SVG (document order).
   * Provided by the Node HTML entry; isomorphic emit hard-fails without it.
   */
  takeMermaidSvg?: () => string;
  /**
   * Consume the next pre-highlighted code HTML (document order).
   * Provided by the Node HTML entry; isomorphic falls back to escaped plain.
   */
  takeHighlightedCode?: () => string | undefined;
  /**
   * Emit each block's Machine Handle as `data-airp-id`. Requested through
   * `targetOptions.machineHandles`; off by default.
   */
  machineHandles?: boolean;
};

export interface WrapBlockOptions {
  attrs?: string;
  className?: string;
  id?: string;
  style?: string;
  /** Root element tag; defaults to `section` for type `section`, else `div`. */
  tag?: string;
}

export type EmitHandler = (
  block: { type: string; [key: string]: unknown },
  ctx: EmitContext,
  levelOffset: number
) => string;

const LEADING_ORDINAL = /^\d+(?:\.\d+)*[.．、]?\s*/;
const HEADING_ORDINAL_SPLIT = /^(\d+(?:\.\d+)*)([.．、])?\s+(.+)$/u;

const MD_CODE = /`([^`]+)`/g;
const MD_LINK = /\[([^\]]+)]\(([^)]+)\)/g;
const MD_BOLD = /\*\*(.+?)\*\*/g;
const MD_STRIKE = /~~(.+?)~~/g;
/** Single-asterisk italic; run after bold so `**…**` is not re-matched. */
const MD_ITALIC = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;

const INLINE_CODE_CLASS = "rounded px-1 py-0.5 font-mono text-[0.85em]";
const INLINE_CODE_STYLE =
  "background-color: var(--code-bg); border: 1px solid var(--code-border); color: var(--text-main)";
const INLINE_STRONG_CLASS = "font-semibold";
const INLINE_STRONG_STYLE = "color: var(--text-main)";
const INLINE_EM_CLASS = "italic";
const INLINE_DEL_CLASS = "line-through";
const INLINE_DEL_STYLE = "color: var(--text-muted)";

function inlineCodeHtml(body: string): string {
  return `<code class="${INLINE_CODE_CLASS}" style="${INLINE_CODE_STYLE}">${body}</code>`;
}

function inlineStrongHtml(body: string): string {
  return `<strong class="${INLINE_STRONG_CLASS}" style="${INLINE_STRONG_STYLE}">${body}</strong>`;
}

function inlineEmHtml(body: string): string {
  return `<em class="${INLINE_EM_CLASS}">${body}</em>`;
}

function inlineDelHtml(body: string): string {
  return `<del class="${INLINE_DEL_CLASS}" style="${INLINE_DEL_STYLE}">${body}</del>`;
}

export function loc(value: unknown): LocalizedString {
  return value as LocalizedString;
}

export function attr(value: string): string {
  return escapeHtml(value);
}

export function wrapBlock(
  type: string,
  inner: string,
  options?: string | WrapBlockOptions
): string {
  const resolved: WrapBlockOptions =
    typeof options === "string" ? { attrs: options } : (options ?? {});
  const tag = resolved.tag ?? (type === "section" ? "section" : "div");
  const className = resolved.className?.trim() ?? "";
  const classAttr = className.length > 0 ? ` class="${attr(className)}"` : "";
  const styleAttr =
    typeof resolved.style === "string" && resolved.style.length > 0
      ? ` style="${attr(resolved.style)}"`
      : "";
  const idAttr = resolved.id ? ` id="${attr(resolved.id)}"` : "";
  const extra = resolved.attrs ? ` ${resolved.attrs}` : "";
  return `<${tag}${classAttr} data-block-type="${attr(type)}"${idAttr}${styleAttr}${extra}>${inner}</${tag}>`;
}

/** Split "1. Title" / "1.1 Title" into sky mono ordinal + rest. */
export function splitHeadingOrdinal(text: string): {
  ordinal: string | null;
  rest: string;
} {
  const match = text.match(HEADING_ORDINAL_SPLIT);
  if (!match) {
    return { ordinal: null, rest: text };
  }
  const digits = match[1] ?? "";
  const mark = match[2] ?? "";
  return { ordinal: `${digits}${mark}`, rest: match[3] ?? text };
}

export interface HeadingTagOptions {
  className?: string;
  /** When false, keep the full title text (section chrome). Default true. */
  splitOrdinal?: boolean;
  style?: string;
}

export function headingTag(
  level: number,
  text: string,
  classNameOrOptions?: string | HeadingTagOptions,
  styleArg?: string
): string {
  const options: HeadingTagOptions =
    typeof classNameOrOptions === "string" || classNameOrOptions === undefined
      ? { className: classNameOrOptions, style: styleArg }
      : classNameOrOptions;
  const h = Math.min(Math.max(level, 1), 6);
  const classAttr = options.className
    ? ` class="${attr(options.className)}"`
    : "";
  const styleAttr = options.style ? ` style="${attr(options.style)}"` : "";
  const split = options.splitOrdinal !== false;
  let inner: string;
  if (split) {
    const { ordinal, rest } = splitHeadingOrdinal(text);
    inner =
      ordinal == null
        ? escapeHtml(text)
        : `<span class="font-mono text-base font-semibold text-sky-600 dark:text-sky-400" data-heading-ordinal="true">${escapeHtml(ordinal)}</span> <span data-heading-text="true">${escapeHtml(rest)}</span>`;
  } else {
    inner = escapeHtml(text);
  }
  return `<h${h}${classAttr}${styleAttr}>${inner}</h${h}>`;
}

/** Map `section.level` (1–4) → HTML heading level (h1 reserved for doc title). */
export function sectionHeadingLevel(sectionLevel: number): number {
  if (sectionLevel <= 1) {
    return 2;
  }
  if (sectionLevel === 2) {
    return 3;
  }
  if (sectionLevel === 3) {
    return 3;
  }
  return 5;
}

export function sectionTitleClass(sectionLevel: number): string {
  if (sectionLevel <= 1) {
    return "text-2xl sm:text-3xl font-bold tracking-tight [overflow-wrap:anywhere]";
  }
  if (sectionLevel === 2) {
    return "text-xl sm:text-2xl font-bold tracking-tight [overflow-wrap:anywhere]";
  }
  if (sectionLevel === 3) {
    return "text-lg sm:text-xl font-bold tracking-tight [overflow-wrap:anywhere]";
  }
  return "text-sm font-semibold [overflow-wrap:anywhere]";
}

/** Standalone `heading` block type scale (level 1–6). */
export function headingBlockClass(level: number): string {
  switch (Math.min(Math.max(level, 1), 6)) {
    case 1:
      return "text-2xl sm:text-3xl font-bold tracking-tight [overflow-wrap:anywhere]";
    case 2:
      return "text-xl sm:text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]";
    case 3:
      return "text-lg sm:text-xl font-semibold [overflow-wrap:anywhere]";
    case 4:
      return "text-base font-semibold [overflow-wrap:anywhere]";
    case 5:
      return "text-sm sm:text-base font-medium [overflow-wrap:anywhere]";
    default:
      return "text-xs sm:text-sm font-medium uppercase tracking-wider [overflow-wrap:anywhere]";
  }
}

export function headingBlockStyle(level: number): string {
  if (level >= 6) {
    return "color: var(--text-muted)";
  }
  if (level === 5) {
    return "color: var(--text-secondary)";
  }
  return "color: var(--text-main)";
}

export function asBlocks(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function childHeadingCtx(
  ctx: EmitContext,
  parentLevel: number
): EmitContext {
  return { ...ctx, headingLevel: Math.min(parentLevel + 1, 6) };
}

/**
 * markdown-lite (inline only): code → link → bold → strike → italic.
 * Block / GFM syntax is left as literal escaped text.
 */
function applyMarkdownLite(escaped: string): string {
  return escaped
    .replace(MD_CODE, (_match, body: string) => inlineCodeHtml(body))
    .replace(
      MD_LINK,
      (_match, label: string, href: string) =>
        `<a href="${attr(href)}" rel="noopener noreferrer">${label}</a>`
    )
    .replace(MD_BOLD, (_match, body: string) => inlineStrongHtml(body))
    .replace(MD_STRIKE, (_match, body: string) => inlineDelHtml(body))
    .replace(MD_ITALIC, (_match, body: string) => inlineEmHtml(body));
}

function renderInlineNodeHtml(node: InlineNode): string {
  switch (node.type) {
    case "text":
      return escapeHtml(node.value);
    case "code":
      return inlineCodeHtml(escapeHtml(node.value));
    case "strong":
      return inlineStrongHtml(
        node.children.map((child) => renderInlineNodeHtml(child)).join("")
      );
    case "link":
      return `<a href="${attr(node.href)}" rel="noopener noreferrer">${node.children.map((child) => renderInlineNodeHtml(child)).join("")}</a>`;
    default:
      return "";
  }
}

export function formatPlain(ctx: EmitContext, value: unknown): string {
  if (value == null) {
    return "";
  }
  return escapeHtml(ctx.t(value as LocalizedString));
}

/**
 * Body-class text: markdown-lite (inline: bold/italic/strike/code/link) for
 * strings; InlineNode AST only on schema 1.0.0. schema 1.1.0 MarkdownString is
 * always a plain string (no InlineNode).
 */
export function formatRichHtml(ctx: EmitContext, value: unknown): string {
  if (value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return applyMarkdownLite(escapeHtml(value));
  }
  if (Array.isArray(value)) {
    if (ctx.schemaVersion === "1.1.0") {
      // 1.1.0 deleted InlineNode; treat as empty rather than mis-render.
      return "";
    }
    return value
      .map((node) => renderInlineNodeHtml(node as InlineNode))
      .join("");
  }
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return applyMarkdownLite(escapeHtml(ctx.t(value as LocalizedString)));
  }
  return escapeHtml(String(value));
}

export function cellTextHtml(value: unknown, ctx: EmitContext): string {
  if (value == null) {
    return "";
  }
  if (typeof value === "string") {
    return escapeHtml(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return escapeHtml(String(value));
  }
  if (Array.isArray(value)) {
    return formatRichHtml(ctx, value as RichText);
  }
  if (typeof value === "object" && value !== null && "label" in value) {
    return formatPlain(ctx, (value as { label: unknown }).label);
  }
  if (typeof value === "object" && value !== null) {
    return formatPlain(ctx, value);
  }
  return escapeHtml(String(value));
}

export function stripLeadingOrdinal(text: string): string {
  return text.replace(LEADING_ORDINAL, "");
}

/** Bullet-list rows when a side is exactly one bulletList block. */
export function extractBulletListRows(
  blocks: unknown[] | undefined,
  ctx: EmitContext
): string[] | null {
  if (!blocks || blocks.length !== 1) {
    return null;
  }
  const only = blocks[0];
  if (!isBlockBase(only) || only.type !== "bulletList") {
    return null;
  }
  const items = only.items;
  if (!Array.isArray(items)) {
    return null;
  }
  return items.map((item) => ctx.tr(item as never));
}
