import { escapeHtml } from "../shared/escape-html.js";
import type { IconName } from "./catalog.js";
import { ICON_CATALOG, ICON_NAMES } from "./catalog.js";

export type { IconName } from "./catalog.js";

export interface RenderIconOptions {
  className?: string;
}

/** Stable fragment id for an icon in the document sprite. */
export function iconSymbolId(name: IconName): string {
  return `airp-icon-${name}`;
}

/** One hidden SVG sprite with every catalog icon as a <symbol>. */
export function renderIconSprite(): string {
  const symbols = ICON_NAMES.map(
    (name) =>
      `<symbol id="${iconSymbolId(name)}" viewBox="0 0 24 24">${ICON_CATALOG[name]}</symbol>`
  ).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" class="html-icon-sprite" aria-hidden="true">${symbols}</svg>`;
}

/** Reference a catalog icon via the document sprite. */
export function renderIcon(
  name: IconName,
  options: RenderIconOptions = {}
): string {
  const className = options.className ?? "size-4 shrink-0";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${escapeHtml(className)}" aria-hidden="true"><use href="#${iconSymbolId(name)}" /></svg>`;
}
