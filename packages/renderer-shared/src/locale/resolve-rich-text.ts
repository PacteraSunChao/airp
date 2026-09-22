import { isRecord } from "@airp/utils";
import type { InlineNode, RichText } from "../document-model.js";
import { resolveLocalized } from "./resolve-localized.js";

function inlineText(nodes: InlineNode[]): string {
  return nodes.map((node) => (node.type === "text" ? node.value : "")).join("");
}

function renderInlineNode(node: InlineNode): string {
  switch (node.type) {
    case "text":
      return node.value;
    case "code":
      return `\`${node.value}\``;
    case "strong":
      return `**${inlineText(node.children)}**`;
    case "link":
      return `[${inlineText(node.children)}](${node.href})`;
    default:
      return "";
  }
}

/**
 * Fold RichText at the knocked-in locale.
 * Plain strings pass through (markdown-lite); maps use resolveLocalized.
 */
export function resolveRichText(
  value: RichText | LocalizedStringLike | undefined,
  locale: string
): string {
  if (value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((node) => renderInlineNode(node as InlineNode)).join("");
  }
  if (isRecord(value)) {
    return resolveLocalized(value as Record<string, string>, locale);
  }
  return "";
}

/** Accept schema-wide union where RichText may also be a locale map. */
type LocalizedStringLike = string | Readonly<Record<string, string>>;
