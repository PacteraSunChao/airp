import { escapeHtml } from "../shared/escape-html.js";
import { itemHandleAttr } from "../shared/inject-machine-handle.js";
import type { CitationItemsHtmlOptions } from "./registry.js";

function attr(value: string): string {
  return escapeHtml(value);
}

/**
 * schema 1.1.0 citation items: display uses order `[1]` `[2]`…;
 * DOM `id` is the machine handle `@id`.
 */
export function citationItemsHtml110(
  items: unknown[],
  options: CitationItemsHtmlOptions
): string {
  return items
    .map((raw, index) => {
      const item = raw as {
        "@id"?: string;
        locator?: string;
        source: string;
      };
      const handle =
        typeof item["@id"] === "string" && item["@id"].length > 0
          ? item["@id"]
          : `cite-${index + 1}`;
      const locator = item.locator
        ? `<span class="ml-2 font-mono text-[11px]" style="color: var(--text-muted)">(${escapeHtml(item.locator)})</span>`
        : "";
      return `<div class="p-3 rounded-lg border flex items-start gap-3 text-xs" id="${attr(handle)}"${itemHandleAttr(options, item)} style="background-color: var(--bg-subtle); border-color: var(--border-subtle)"><span class="font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 px-1.5 py-0.5 rounded flex-shrink-0">[${index + 1}]</span><div class="min-w-0 flex-1 [overflow-wrap:anywhere]"><span class="font-medium" style="color: var(--text-main)">${escapeHtml(item.source)}</span>${locator}</div></div>`;
    })
    .join("");
}
