import { escapeHtml } from "./escape-html.js";

export interface RenderSvgViewerOptions {
  /**
   * Machine Handle of the node this viewer stands for. Only set when the host
   * asked for handles, so the default shell is unchanged.
   */
  atId?: string;
  minHeight: number;
  storageKey?: string;
  svg: string;
  /** Optional chrome title (Mermaid / architecture overview). */
  title?: string;
}

/**
 * Declarative `.svg-viewer` shell for an inline SVG (hydrated by client script).
 * Structure: chrome (title + zoom host) → svg → (client adds surface/resize).
 */
export function renderSvgViewer(options: RenderSvgViewerOptions): string {
  const minHeight = Math.round(options.minHeight);
  const storageAttr =
    typeof options.storageKey === "string" && options.storageKey.length > 0
      ? ` data-storage-key="${escapeHtml(options.storageKey)}"`
      : "";
  const titleText =
    typeof options.title === "string" && options.title.trim().length > 0
      ? options.title.trim()
      : "";
  const titleHtml =
    titleText.length > 0
      ? `<span class="font-mono font-medium" data-svg-viewer-title="true" style="color: var(--text-secondary)">${escapeHtml(titleText)}</span>`
      : `<span class="font-mono font-medium" data-svg-viewer-title="true" style="color: var(--text-secondary)"></span>`;
  const chrome = `<div class="flex items-center justify-between px-4 py-2 border-b text-xs" data-svg-viewer-chrome="true" style="border-color: var(--border-color); background-color: var(--bg-subtle); color: var(--text-secondary)">${titleHtml}<div class="flex items-center gap-1.5" data-svg-viewer-zoom="true"></div></div>`;
  const atIdAttr =
    typeof options.atId === "string" && options.atId.length > 0
      ? ` data-airp-id="${escapeHtml(options.atId)}"`
      : "";
  return `<div class="svg-viewer"${atIdAttr} data-min-height="${minHeight}"${storageAttr} style="height:${minHeight}px">${chrome}${options.svg}</div>`;
}
