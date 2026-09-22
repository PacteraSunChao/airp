import type { SchemaVersion } from "@airp/protocol";
import type {
  LocaleFormatContext,
  LocalizedString,
} from "@airp/renderer-shared";
import { isBlockBase } from "@airp/renderer-shared";

export type EmitContext = LocaleFormatContext & {
  headingLevel: number;
  /** Document schema version (drives citation display, etc.). */
  schemaVersion: SchemaVersion;
};

export type EmitHandler = (
  block: { type: string; [key: string]: unknown },
  ctx: EmitContext,
  levelOffset: number
) => string;

const LEADING_ORDINAL = /^\d+\.\s*/;

export function loc(value: unknown): LocalizedString {
  return value as LocalizedString;
}

export function mdHeading(level: number, text: string): string {
  const h = Math.min(Math.max(level, 1), 6);
  return `${"#".repeat(h)} ${text}\n\n`;
}

export function fence(code: string, lang?: string): string {
  return `\`\`\`${lang ?? ""}\n${code}\n\`\`\`\n\n`;
}

/**
 * Table cell text. Column keys only — ignores row `@id` (schema 1.1.0).
 */
export function cellText(value: unknown, ctx: EmitContext): string {
  if (value == null) {
    return "";
  }
  if (typeof value === "string") {
    return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (ctx.schemaVersion === "1.1.0") {
      return "";
    }
    return ctx
      .tr(value as never)
      .replace(/\|/g, "\\|")
      .replace(/\n/g, " ");
  }
  if (typeof value === "object" && value !== null && "label" in value) {
    return ctx.t((value as { label: unknown }).label as never);
  }
  if (typeof value === "object" && value !== null) {
    return ctx
      .t(value as LocalizedString)
      .replace(/\|/g, "\\|")
      .replace(/\n/g, " ");
  }
  return String(value);
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

export function childHeadingCtx(
  ctx: EmitContext,
  parentLevel: number
): EmitContext {
  return { ...ctx, headingLevel: Math.min(parentLevel + 1, 6) };
}

export function gfmTable(headers: string[], rows: string[][]): string {
  const esc = (s: string) => s.replace(/\|/g, "\\|");
  const header = `| ${headers.map(esc).join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.map(esc).join(" | ")} |`).join("\n");
  return `${header}\n${sep}\n${body}\n\n`;
}

export function asBlocks(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
