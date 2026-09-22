import { htmlLocaleMessage } from "../i18n/html-locale.js";
import { escapeHtml } from "../shared/escape-html.js";

/** One outline row collected while emitting `section` blocks. */
export interface PageTocEntry {
  id: string;
  level: number;
  title: string;
}

/** Notion-style floating TOC needs at least two sections. */
export const PAGE_TOC_MIN_ENTRIES = 2;

const TICK_WIDTH_CLASS: Record<number, string> = {
  1: "w-5",
  2: "w-4",
  3: "w-3",
  4: "w-2",
};

const ITEM_PAD_CLASS: Record<number, string> = {
  1: "pl-0",
  2: "pl-3",
  3: "pl-5",
  4: "pl-7",
};

function clampTocLevel(level: number): number {
  if (level <= 1) {
    return 1;
  }
  if (level >= 4) {
    return 4;
  }
  return level;
}

function tickClass(level: number): string {
  const width = TICK_WIDTH_CLASS[clampTocLevel(level)] ?? "w-3";
  return `block h-0.5 rounded-full no-underline transition-colors ${width} bg-[var(--text-muted)] hover:bg-[var(--text-secondary)] data-[toc-active=true]:bg-[var(--text-main)]`;
}

function itemClass(level: number): string {
  const pad = ITEM_PAD_CLASS[clampTocLevel(level)] ?? "pl-3";
  return `block max-w-[16rem] truncate rounded-md px-2 py-1 text-xs no-underline transition-colors ${pad} text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-main)] data-[toc-active=true]:bg-sky-50 data-[toc-active=true]:text-sky-600 dark:data-[toc-active=true]:bg-sky-950/40 dark:data-[toc-active=true]:text-sky-400`;
}

/**
 * Render a Notion-style floating page TOC, or empty string when below the
 * minimum entry count.
 *
 * Both mini ticks and the expanded panel share the same top-right anchor.
 * Vertical `top` is a fixed viewport offset (CSS); horizontal `right` is
 * synced to the main column gutter by `page-toc-script`.
 */
export function renderPageToc(
  entries: readonly PageTocEntry[],
  locale: string
): string {
  if (entries.length < PAGE_TOC_MIN_ENTRIES) {
    return "";
  }

  const label = escapeHtml(
    htmlLocaleMessage("components.page-toc.label", locale)
  );
  const ticks = entries
    .map((entry) => {
      const level = clampTocLevel(entry.level);
      const title = escapeHtml(entry.title);
      const id = escapeHtml(entry.id);
      return `<a class="${tickClass(level)}" data-page-toc-tick="true" data-toc-level="${level}" href="#${id}" title="${title}" aria-label="${title}"></a>`;
    })
    .join("");
  const items = entries
    .map((entry) => {
      const level = clampTocLevel(entry.level);
      const title = escapeHtml(entry.title);
      const id = escapeHtml(entry.id);
      return `<a class="${itemClass(level)}" data-page-toc-item="true" data-toc-level="${level}" href="#${id}">${title}</a>`;
    })
    .join("");

  return `<nav class="page-toc fixed z-30 hidden md:block" data-page-toc="true" aria-label="${label}" style="top: 10rem; right: max(0.5rem, calc((100vw - 56rem) / 2 - 1.5rem))"><div class="page-toc-shell relative" data-page-toc-shell="true"><div class="page-toc-mini flex flex-col items-end gap-1.5 py-1" data-page-toc-mini="true">${ticks}</div><div class="page-toc-panel airp-float-panel max-h-[min(70vh,32rem)] w-max max-w-[18rem] flex-col gap-0.5 overflow-y-auto rounded-xl border p-2.5" data-page-toc-panel="true" style="background-color: var(--bg-surface); border-color: var(--border-color); box-shadow: var(--shadow-float)">${items}</div></div></nav>`;
}
