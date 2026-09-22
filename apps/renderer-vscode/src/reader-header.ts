import { escapeHtml } from "./escape-html";

const DOWNLOAD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 shrink-0" aria-hidden="true"><use href="#airp-icon-download" /></svg>`;
const FILE_TEXT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 shrink-0" aria-hidden="true"><use href="#airp-icon-file-text" /></svg>`;
const MENU_DOWNLOAD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0" aria-hidden="true"><use href="#airp-icon-download" /></svg>`;

/** Match HTML reader color-scheme toggle chrome (classes + theme tokens). */
const TOGGLE_BUTTON_CLASS =
  "airp-interactive inline-flex items-center justify-center p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500";
const TOGGLE_BUTTON_STYLE =
  "border-color: var(--border-color); background-color: var(--bg-subtle); color: var(--text-secondary)";

/** App-header trailing: Edit Source + export menu. */
export function buildAppHeader(): string {
  return `${buildEditSourceButton()}${buildExportHeader()}`;
}

function buildEditSourceButton(): string {
  return `<button type="button" class="${TOGGLE_BUTTON_CLASS}" data-airp-edit-source aria-label="${escapeHtml("Edit Source")}" style="${TOGGLE_BUTTON_STYLE}">${FILE_TEXT_ICON}<span class="sr-only">${escapeHtml("Edit Source")}</span></button>`;
}

/** Export icon with hover/click HTML / Markdown menu (sources-popover chrome). */
export function buildExportHeader(): string {
  const label = escapeHtml("Export");
  return `<div data-airp-export>
  <button type="button" class="${TOGGLE_BUTTON_CLASS}" data-airp-export-trigger aria-haspopup="menu" aria-expanded="false" aria-label="${label}" style="${TOGGLE_BUTTON_STYLE}">${DOWNLOAD_ICON}<span class="sr-only">${label}</span></button>
  <div class="airp-float-panel" data-airp-export-menu role="menu" aria-hidden="true">
    <div data-airp-export-menu-header>${MENU_DOWNLOAD_ICON}<span>${label}</span></div>
    <div data-airp-export-menu-items>
      <button type="button" role="menuitem" data-airp-export-format="html">${escapeHtml("HTML")}</button>
      <button type="button" role="menuitem" data-airp-export-format="markdown">${escapeHtml("Markdown")}</button>
    </div>
  </div>
</div>`;
}
