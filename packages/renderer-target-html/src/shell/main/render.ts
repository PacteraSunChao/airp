import { htmlLocaleMessage } from "../../i18n/html-locale.js";
import { renderIcon } from "../../icons/render-icon.js";
import { escapeHtml } from "../../shared/escape-html.js";
import {
  AIRP_GITHUB_REPO_URL,
  AIRP_RENDERER_PRODUCT_NAME,
  AIRP_RENDERER_PRODUCT_VERSION,
} from "../../shared/product-chrome.js";
import { resolveHtmlTargetOptions } from "../../shared/target-options.js";
import {
  styleBorder,
  styleSubtle,
  styleSurface,
  styles,
  styleTextMain,
  styleTextMuted,
  styleTextSecondary,
} from "../../shared/theme-style.js";

export interface RenderMainOptions {
  bodyHtml: string;
  extraAppHeader?: string;
  locale: string;
  pageTocHtml?: string;
  /** Document `schemaVersion` from airp.json (footer protocol label). */
  schemaVersion: string;
}

/** Document chrome: sticky header → main → footer. */
export function renderMain(options: RenderMainOptions): string {
  const lightLabel = escapeHtml(
    htmlLocaleMessage("client.color-scheme-script.light", options.locale)
  );
  const productName = escapeHtml(AIRP_RENDERER_PRODUCT_NAME);
  const productVersion = escapeHtml(AIRP_RENDERER_PRODUCT_VERSION);
  const protocolVersion = escapeHtml(options.schemaVersion);
  const colorSchemeToggle = `<button type="button" id="app-color-scheme-toggle" class="airp-interactive p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500" data-color-scheme="light" aria-label="${lightLabel}" style="${styles(styleBorder, styleSubtle, styleTextSecondary)}">${renderIcon("sun", { className: "size-4 shrink-0" })}<span class="sr-only">${lightLabel}</span></button>`;
  const trailingExtra =
    typeof options.extraAppHeader === "string" &&
    options.extraAppHeader.length > 0
      ? `<div data-extra-app-header="true">${options.extraAppHeader}</div>`
      : "";
  const githubLabel = escapeHtml("maosong-ai/airp");
  const brandMark = `<span class="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-white flex-shrink-0" aria-hidden="true">${renderIcon("layers", { className: "w-4 h-4" })}</span>`;

  return `<header class="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors" style="${styles(styleBorder, styleSurface)}">
<div class="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
<div class="flex items-center gap-2.5 min-w-0">
${brandMark}
<span class="font-bold tracking-tight text-sm sm:text-base truncate" style="${styleTextMain}">${productName}</span>
</div>
<div class="flex items-center gap-2 shrink-0" data-app-header-trailing="true">
${colorSchemeToggle}
${trailingExtra}
</div>
</div>
</header>
<main class="flex-1 w-full min-w-0 max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-10" data-route-path="/">${options.bodyHtml}</main>
${options.pageTocHtml ?? ""}
<footer class="w-full border-t py-6 transition-colors" style="${styles(styleBorder, styleSurface)}">
<div class="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-center sm:text-left" style="${styleTextSecondary}">
<div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
<span class="font-mono">AIRP Renderer v${productVersion}</span>
<span style="${styleTextMuted}">•</span>
<span class="font-mono">AI Report Protocol v${protocolVersion}</span>
</div>
<a class="inline-flex items-center gap-2 rounded-md px-1.5 py-1 -mx-1.5 hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-950/40 dark:hover:text-sky-300 transition" href="${escapeHtml(AIRP_GITHUB_REPO_URL)}" rel="noopener noreferrer" target="_blank">${renderIcon("github", { className: "w-4 h-4" })}<span class="font-mono">${githubLabel}</span></a>
</div>
</footer>`;
}

/** Resolve optional header injection from targetOptions. */
export function resolveExtraAppHeader(
  targetOptions: Readonly<Record<string, unknown>> | undefined
): string | undefined {
  return resolveHtmlTargetOptions(targetOptions).extraAppHeader;
}
