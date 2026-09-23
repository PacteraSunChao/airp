import type {
  AirpDocumentModel,
  InlineNode,
  RichText,
} from "../document-model.js";
import { resolveLocalized } from "./resolve-localized/registry.js";

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
 * Plain strings pass through (markdown-lite); locale maps use versioned
 * resolveLocalized.
 */
export function resolveRichText(
  value: RichText | undefined,
  locale: string,
  doc: AirpDocumentModel
): string {
  if (value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((node) => renderInlineNode(node)).join("");
  }
  return resolveLocalized(value, locale, doc);
}
